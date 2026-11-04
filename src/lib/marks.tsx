// Turns the Desk's simple writing marks into set text.
//   blank line   -> new paragraph
//   ## Heading   -> a section heading
//   > A line     -> a pull quote
//   + A verse — Reference -> Scripture, with its reference
//   *italic*  **bold**
// Used to show pieces on member pages, and (next) to publish approved pieces to Sanity.
import type { ReactNode } from 'react';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'verse'; text: string; reference?: string };

export function parseBody(body: string): Block[] {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith('## ')) return { type: 'h', text: chunk.slice(3).trim() };
      if (chunk.startsWith('> ')) return { type: 'quote', text: chunk.replace(/^>\s?/gm, '').trim() };
      if (chunk.startsWith('+ ')) {
        const [text, reference] = chunk.slice(2).split(/\s+[—–-]{1,2}\s+(?=[^—–-]+$)/);
        return { type: 'verse', text: text.trim(), reference: reference?.trim() };
      }
      return { type: 'p', text: chunk };
    });
}

/** *italic* and **bold** inside a paragraph; a single line break inside a paragraph stays a line break (poems). */
export function inline(text: string): ReactNode[] {
  if (text.includes('\n')) return text.split('\n').flatMap((line, i) => (i ? [<br key={`br${i}`} />, ...inlineLine(line, i)] : inlineLine(line, i)));
  return inlineLine(text, 0);
}
function inlineLine(text: string, line: number): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <strong key={`${line}-${i++}`}>{m[1]}</strong> : <em key={`${line}-${i++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Body({ body }: { body: string }) {
  return (
    <>
      {parseBody(body).map((b, i) =>
        b.type === 'h' ? <h2 key={i} className="eb">{inline(b.text)}</h2>
        : b.type === 'quote' ? <blockquote key={i} className="m-quote">{inline(b.text)}</blockquote>
        : b.type === 'verse' ? <blockquote key={i} className="m-verse">{inline(b.text)}{b.reference && <cite>{b.reference}</cite>}</blockquote>
        : <p key={i} className={b.text.includes('\n') ? 'body lines' : 'body'}>{inline(b.text)}</p>,
      )}
    </>
  );
}

/** The large opening letter is for longer essay-style pieces only: never poems, prose, or short pieces. */
export function wantsDropCap(medium: string, body: string): boolean {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return !['poetry', 'prose'].includes(medium) && words >= 400;
}
