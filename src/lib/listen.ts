// Listen: a piece read aloud while you read along. The voice is the reader's own device's (nothing is recorded or sent
// anywhere, and it costs nothing). The piece is spoken a sentence or two at a time, so the paragraph being read can be
// marked on the page, and so pausing, skipping and changing speed are immediate. A small player sits at the foot of the screen.
//
// If recorded readings come later (a writer's own voice, or a studio voice), this player stays: only what it plays changes.
interface Chunk { text: string; block: number }
export interface ListenOptions {
  button: HTMLElement;                 // the Listen button (shown only when the device can speak)
  blocks: () => HTMLElement[];         // the paragraphs, headings and quotations, in reading order
  title: string; by: string;           // spoken first: "Title, by Writer."
}

const GOOD = ['Daniel', 'Serena', 'Samantha', 'Karen', 'Moira', 'Tessa', 'Google UK English Male', 'Google UK English Female', 'Google US English',
  'Microsoft Ryan', 'Microsoft Sonia', 'Microsoft Guy', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Libby'];
/** The best English voice the device has: a known natural one first, an "enhanced" one where offered, never a novelty voice.
 *  Voices that live on the device come before ones fetched over the network: Chrome's "Google" voices on a computer often
 *  stay silent or cut out, so they are a last resort. `bad` holds voices that have already failed here. */
function pickVoice(bad: Set<string>): SpeechSynthesisVoice | null {
  const en = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang) && !bad.has(v.voiceURI || v.name));
  if (!en.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const at = GOOD.findIndex((n) => v.name.startsWith(n));
    return (at >= 0 ? 100 - at : 0) + (/enhanced|premium|natural|neural/i.test(v.name) ? 60 : 0) + (v.default ? 5 : 0) + (v.localService ? 30 : 0)
      - (!v.localService && /^Google/i.test(v.name) ? 400 : 0);
  };
  return [...en].sort((a, b) => score(b) - score(a))[0];
}

/** A block's words, a sentence or two at a time (short pieces keep the voice from cutting out on some browsers). Poems go line by line. */
function split(text: string, lines: boolean): string[] {
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
  if (lines) return text.split('\n').map(clean).filter(Boolean);
  const out: string[] = []; let cur = '';
  for (const s of clean(text).match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g) ?? []) {
    if (cur && (cur + s).length > 220) { out.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const ICON = {
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="2.4"/>',
  back: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
  on: '<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const svg = (d: string) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const RATES = [1, 1.15, 1.3, 0.85];

/** Sets the Listen button up. Returns a function that stops the voice and takes the player away (for pages that change in place). */
export function initListen({ button, blocks, title, by }: ListenOptions): () => void {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return () => {};
  const synth = speechSynthesis;
  synth.getVoices(); synth.addEventListener?.('voiceschanged', () => { /* the list is ready */ });
  button.hidden = false;

  let els: HTMLElement[] = [], chunks: Chunk[] = [], at = 0, token = 0, playing = false, rate = RATES[0], current: SpeechSynthesisUtterance | null = null;
  const bad = new Set<string>(); let fails = 0, mute = false;   // voices that stayed silent here, and whether none is left
  let bar: HTMLElement | null = null;
  try { const r = Number(localStorage.getItem('oa_listen_rate')); if (RATES.includes(r)) rate = r; } catch {}

  const build = () => {
    els = blocks().filter((e) => (e.innerText || '').trim());
    chunks = [{ text: `${title}, by ${by}.`, block: -1 }];
    els.forEach((el, b) => split(el.innerText, el.classList.contains('lines')).forEach((text) => chunks.push({ text, block: b })));
  };
  const mark = () => {
    const now = chunks[at]?.block ?? -1;
    els.forEach((el, b) => el.classList.toggle('ls-now', playing !== null && b === now && !!bar));
    const el = els[now];
    if (!el || !playing) return;
    // Follow along only while the reader is near the place being read; if they've wandered off, leave them be.
    const r = el.getBoundingClientRect();
    if (r.top > -innerHeight * 0.4 && r.bottom < innerHeight * 1.4 && (r.top < 90 || r.bottom > innerHeight - 190)) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const paint = () => {
    if (!bar) return;
    bar.querySelector('[data-ls-play]')!.innerHTML = svg(playing ? ICON.pause : ICON.play);
    bar.querySelector('[data-ls-play]')!.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    bar.querySelector<HTMLElement>('[data-ls-fill]')!.style.transform = `scaleX(${chunks.length ? at / chunks.length : 0})`;
    bar.querySelector('[data-ls-rate]')!.textContent = `${rate}×`;
    bar.querySelector('[data-ls-state]')!.textContent = mute ? 'No reading voice in this browser' : playing ? 'Reading aloud' : at >= chunks.length ? 'The end' : 'Paused';
    button.setAttribute('aria-pressed', String(!!bar));
    const word = button.querySelector('[data-listen-word]'); if (word) word.textContent = bar ? 'Listening' : 'Listen';
    mark();
  };
  const say = () => {
    if (at >= chunks.length) { playing = false; paint(); setTimeout(() => { if (!playing && at >= chunks.length) close(); }, 2400); return; }
    const my = ++token, u = new SpeechSynthesisUtterance(chunks[at].text), voice = pickVoice(bad);
    if (!voice && bad.size) { playing = false; mute = true; paint(); return; }   // every voice here has stayed silent
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
    u.rate = rate;
    let started = false, t1 = 0, t2 = 0;
    const done = () => { clearTimeout(t1); clearTimeout(t2); };
    const next = () => { if (my !== token || !playing) return; done(); fails = 0; at++; paint(); say(); };
    // A voice that errors or stays silent (it happens with voices fetched over the network, on computers): set it aside and
    // read the same words with the next best one. If nothing on this device will speak, say so instead of pretending.
    const fail = () => {
      if (my !== token || !playing) return; done();
      if (voice) bad.add(voice.voiceURI || voice.name);
      if (!voice || ++fails > 4) { playing = false; mute = true; token++; synth.cancel(); paint(); return; }
      const mine = ++token; synth.cancel(); setTimeout(() => { if (mine === token && playing) say(); }, 140);
    };
    u.onstart = () => { started = true; };
    u.onend = next;
    u.onerror = (e) => { if (my !== token) return; const why = (e as SpeechSynthesisErrorEvent).error; if (why === 'interrupted' || why === 'canceled') return; fail(); };
    if (voice && !voice.localService) {   // only network voices are watched; a device's own voice is left to speak in peace
      t1 = window.setTimeout(() => { if (my === token && playing && !started) fail(); }, 4000);
      t2 = window.setTimeout(() => { if (my === token && playing) fail(); }, 7000 + (u.text.length * 130) / rate);
    }
    current = u;   // (kept, or some browsers forget the voice mid-sentence)
    if (synth.paused) synth.resume();   // (a browser left paused by another page would queue this in silence)
    synth.speak(u);
  };
  const play = (from = at, afterStop = false) => {
    at = Math.max(0, Math.min(from, chunks.length)); playing = true; mute = false; fails = 0; paint();
    if (afterStop) setTimeout(() => { if (playing) say(); }, 90); else say();   // a breath after stopping the last sentence, or some browsers drop the next
  };
  const hush = () => { token++; if (synth.speaking || synth.pending) synth.cancel(); };
  const pause = () => { playing = false; hush(); paint(); };
  const jump = (dir: 1 | -1) => {
    // to the start of the next paragraph, or back to the start of this one (or the one before, if already there)
    const b = chunks[Math.min(at, chunks.length - 1)]?.block ?? -1, first = (blk: number) => chunks.findIndex((c) => c.block === blk);
    let to: number;
    if (dir > 0) { to = chunks.findIndex((c, i) => i > at && c.block > b); if (to < 0) to = chunks.length; }
    else to = at > first(b) ? first(b) : Math.max(0, first(b - 1));
    const was = playing; hush(); if (was) play(to, true); else { at = Math.max(0, to); paint(); }
  };
  function close() {
    playing = false; hush(); bar?.remove(); bar = null; current = null;
    els.forEach((el) => el.classList.remove('ls-now')); button.setAttribute('aria-pressed', 'false');
    const word = button.querySelector('[data-listen-word]'); if (word) word.textContent = 'Listen';
    document.documentElement.classList.remove('ls-open');
  }
  const open = () => {
    build();
    bar = document.createElement('div'); bar.className = 'ls-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Listening');
    bar.innerHTML = `<span class="ls-line" aria-hidden="true"><span data-ls-fill></span></span>
      <button type="button" class="ls-b" data-ls-back aria-label="Back a paragraph">${svg(ICON.back)}</button>
      <button type="button" class="ls-b ls-play" data-ls-play></button>
      <button type="button" class="ls-b" data-ls-on aria-label="On a paragraph">${svg(ICON.on)}</button>
      <span class="ls-t"><span class="lab" data-ls-state></span><span class="ls-title">${title.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))}</span></span>
      <button type="button" class="ls-b ls-rate lab" data-ls-rate aria-label="Reading speed"></button>
      <button type="button" class="ls-b" data-ls-close aria-label="Stop listening">${svg(ICON.close)}</button>`;
    document.body.append(bar); document.documentElement.classList.add('ls-open');
    bar.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('button'); if (!t) return;
      if (t.hasAttribute('data-ls-play')) { if (playing) pause(); else play(at >= chunks.length ? 0 : at); }
      else if (t.hasAttribute('data-ls-back')) jump(-1);
      else if (t.hasAttribute('data-ls-on')) jump(1);
      else if (t.hasAttribute('data-ls-close')) close();
      else if (t.hasAttribute('data-ls-rate')) {
        rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length]; try { localStorage.setItem('oa_listen_rate', String(rate)); } catch {}
        if (playing) { hush(); play(at, true); } else paint();
      }
    });
    play(0);
  };
  const toggle = () => { if (bar) close(); else open(); };
  // Leaving the page stops the voice. Coming back to a phone that silenced it shows Paused, not a player pretending to read.
  const leave = () => { token++; synth.cancel(); };
  const back = () => { if (!document.hidden && bar && playing) setTimeout(() => { if (playing && !synth.speaking && !synth.pending) pause(); }, 600); };
  button.addEventListener('click', toggle); addEventListener('pagehide', leave); document.addEventListener('visibilitychange', back);
  return () => { close(); button.removeEventListener('click', toggle); removeEventListener('pagehide', leave); document.removeEventListener('visibilitychange', back); };
}
