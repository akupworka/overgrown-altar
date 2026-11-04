// The writing sheet, styled as you write: bold looks bold, a Scripture verse looks like the site's verse.
// Underneath, the piece is still kept in the Desk's simple writing marks (see src/lib/marks.tsx),
// so saved and published pieces read exactly as before:
//   ## Heading   > Pull quote   + Verse — Reference   *italic*   **bold**
import { useEditor, EditorContent, type Editor as TipTap } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { parseBody } from '../../lib/marks';

// A pull quote and a verse: one line of text each, set in the site's own style.
const PullQuote = Node.create({
  name: 'pullquote', group: 'block', content: 'inline*', defining: true,
  parseHTML: () => [{ tag: 'blockquote.m-quote', priority: 60 }],
  renderHTML: ({ HTMLAttributes }) => ['blockquote', mergeAttributes(HTMLAttributes, { class: 'm-quote' }), 0],
  addInputRules() { return [textblockTypeInputRule({ find: /^>\s$/, type: this.type })]; },
});
const Verse = Node.create({
  name: 'verse', group: 'block', content: 'inline*', defining: true,
  parseHTML: () => [{ tag: 'blockquote.m-verse', priority: 60 }],
  renderHTML: ({ HTMLAttributes }) => ['blockquote', mergeAttributes(HTMLAttributes, { class: 'm-verse' }), 0],
  addInputRules() { return [textblockTypeInputRule({ find: /^\+\s$/, type: this.type })]; },
});

// ---- writing marks  <->  the styled sheet
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inlineHtml = (s: string) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');
// In the sheet, each line is its own line (Enter), and an empty line separates paragraphs or stanzas,
// exactly as the writer sees it. Saved, a paragraph's lines are joined by one line break and paragraphs by a blank line.
export function marksToHtml(body: string): string {
  const out: string[] = [];
  let lastWasP = false;
  for (const b of parseBody(body)) {
    if (b.type === 'p') {
      if (lastWasP) out.push('<p></p>');
      out.push(...b.text.split('\n').map((line) => `<p>${inlineHtml(line)}</p>`));
      lastWasP = true; continue;
    }
    lastWasP = false;
    out.push(b.type === 'h' ? `<h2>${inlineHtml(b.text)}</h2>`
      : b.type === 'quote' ? `<blockquote class="m-quote">${inlineHtml(b.text)}</blockquote>`
      : `<blockquote class="m-verse">${inlineHtml(b.text + (b.reference ? ` — ${b.reference}` : ''))}</blockquote>`);
  }
  return out.join('') || '<p></p>';
}
function inlineMarks(node: PMNode): string {
  let out = '';
  node.forEach((child) => {
    if (child.type.name === 'hardBreak') { out += '\n'; return; }
    const t = child.text ?? '';
    const bold = child.marks.some((m) => m.type.name === 'bold');
    const italic = child.marks.some((m) => m.type.name === 'italic');
    // Keep the spaces outside the marks, so "*word *" never happens.
    const [, lead, core, trail] = t.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ['', '', t, ''];
    out += !core ? t : lead + (bold ? `**${core}**` : italic ? `*${core}*` : core) + trail;
  });
  return out.trim();
}
export function docToMarks(doc: PMNode): string {
  const chunks: string[] = [];
  let lines: string[] = [];
  const flush = () => { if (lines.length) chunks.push(lines.join('\n')); lines = []; };
  doc.forEach((n) => {
    const text = inlineMarks(n);
    if (n.type.name === 'paragraph') { if (text) lines.push(text); else flush(); return; }   // an empty line ends the paragraph
    flush();
    if (!text) return;
    chunks.push(n.type.name === 'heading' ? `## ${text}` : n.type.name === 'pullquote' ? `> ${text}` : n.type.name === 'verse' ? `+ ${text}` : text);
  });
  flush();
  return chunks.join('\n\n');
}

export type Tool = 'heading' | 'pullquote' | 'verse' | 'italic' | 'bold';
export const TOOL_LABELS: { tool: Tool; label: string; hint: string }[] = [
  { tool: 'heading', label: 'Section heading', hint: 'Starts a new section with a small heading' },
  { tool: 'pullquote', label: 'Pull quote', hint: 'A line set large, in italics' },
  { tool: 'verse', label: 'Scripture', hint: 'A verse; end it with — and the reference' },
  { tool: 'italic', label: 'Italic', hint: 'Slanted words' },
  { tool: 'bold', label: 'Bold', hint: 'Strong words' },
];
export function applyTool(ed: TipTap | null, tool: Tool) {
  if (!ed) return;
  const c = ed.chain().focus();
  if (tool === 'heading') c.toggleHeading({ level: 2 }).run();
  else if (tool === 'italic') c.toggleItalic().run();
  else if (tool === 'bold') c.toggleBold().run();
  else (ed.isActive(tool) ? c.setParagraph() : c.setNode(tool)).run();
}
export const isOn = (ed: TipTap | null, tool: Tool) => !!ed && (tool === 'heading' ? ed.isActive('heading', { level: 2 }) : ed.isActive(tool));

export function useRichBody(initial: string, onChange: (marks: string) => void) {
  return useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] }, blockquote: false, bulletList: false, orderedList: false, listItem: false,
        code: false, codeBlock: false, horizontalRule: false, strike: false,
      }),
      PullQuote, Verse,
      Placeholder.configure({ placeholder: 'Begin here. Enter starts a new line; leave an empty line between paragraphs or stanzas.' }),
    ],
    content: marksToHtml(initial),
    editorProps: { attributes: { class: 'd-rich-in', 'aria-label': 'The piece', 'aria-multiline': 'true', role: 'textbox' } },
    onUpdate: ({ editor }) => onChange(docToMarks(editor.state.doc)),
  });
}

export function RichBody({ editor }: { editor: TipTap | null }) {
  return <EditorContent editor={editor} className="d-paper-body d-rich" />;
}
