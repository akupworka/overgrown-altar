// Every kind of work the Guild publishes, room by room: what it is, what the editor looks for, and a rough length.
// Used by the Crafts page (/crafts/) and the Archive filters. The Desk's choices come from lib/supabase.ts (MEDIUMS).
export type PillarId = 'watchtower' | 'hearth' | 'perimeter';
export interface Kind {
  value: string; name: string; plural: string; pillar: PillarId; what: string; lookFor: string; length: string;
  avoid: string;     // what a piece of this kind is most often returned for
  sample: string;    // one made-up idea for a piece, to show the size and shape of the thing (not a published piece)
}
export interface Room { id: PillarId; name: string; line: string; kinds: Kind[] }

export const ROOMS: Room[] = [
  {
    id: 'watchtower', name: 'The Watchtower', line: 'Essays that take a great secular mind seriously, find where it fractured, and set the anchor.',
    kinds: [
      { value: 'essay', name: 'Essay / Dispatch', plural: 'Essays', pillar: 'watchtower',
        what: 'A long-form essay or cultural audit. It names a thinker, an idea or an idol of the age, finds where it fractured, and anchors it again in Christ.',
        lookFor: 'A real argument fairly made; the opposing mind given its due; sources honestly cited; prose that is clear before it is clever.',
        length: '1,500–5,000 words',
        avoid: 'A sermon with a famous name attached; a caricature of the thinker that his own readers would not recognise; an anchor announced in the last paragraph instead of argued.', sample: 'Nietzsche saw that a faith kept only as habit is already dead. What he put in its place cannot carry a human life, and the strength he was looking for is the strength that lays itself down.' },
    ],
  },
  {
    id: 'hearth', name: 'The Hearth', line: 'The creative room: work made with reverence and brought to the fire to be read.',
    kinds: [
      { value: 'prose', name: 'Prose', plural: 'Prose', pillar: 'hearth',
        what: 'Short non-fiction from the heart: reflections, meditations, letters, small essays of place and memory.',
        lookFor: 'One true thing, carefully seen; restraint; an ending that earns its quiet.', length: '250–2,000 words',
        avoid: 'A diary entry; a lesson stated instead of shown; three subjects where one would do.', sample: 'The week my father forgot the hymn he taught me, and what his hands still knew how to do.' },
      { value: 'poetry', name: 'Poetry', plural: 'Poems', pillar: 'hearth',
        what: 'Poems, psalms and songs in any form, from strict meter to free verse.',
        lookFor: 'Every line doing work; images that are seen, not borrowed; sound read aloud before it is sent.', length: 'Any length; most under 60 lines',
        avoid: 'Rhyme that forces the sense; large words (grace, glory, brokenness) with nothing seen behind them; a tidy moral in the last line.', sample: 'A psalm of complaint that does not resolve until its final line, and then only just.' },
      { value: 'fiction', name: 'Fiction', plural: 'Fiction', pillar: 'hearth',
        what: 'Short stories, flash fiction and self-contained chapters that tell the truth slant.',
        lookFor: 'A story that moves; characters with weight; grace that is not sentimental.', length: '300–6,000 words',
        avoid: 'A tract dressed as a story; a conversion that costs nothing; characters who exist only to be wrong.', sample: 'A verger finds the church unlocked every morning for a month, and decides to tell no one.' },
      { value: 'photograph', name: 'Photographs', plural: 'Photographs', pillar: 'hearth',
        what: 'Dark, atmospheric photography: stone in monochrome, color through glass. One photograph, with the details behind the lens (digital or film, camera, lens) and at least 100 words of your own: what you saw, what you felt, why this light.',
        lookFor: 'A considered eye; light used as meaning; a photograph at least 1600 pixels wide, your own.', length: 'One photograph · 100+ words',
        avoid: 'Heavy filters; a picture that is not your own; words that explain the photograph instead of seeing it.', sample: 'The north aisle at four in the afternoon, when the one clear pane throws a white square on the stone.' },
    ],
  },
  {
    id: 'perimeter', name: 'The Perimeter', line: 'Testimony from the edge of the unseen, told honestly and anchored in Christ.',
    kinds: [
      { value: 'testimony', name: 'Testimony', plural: 'Testimonies', pillar: 'perimeter',
        what: 'What God has done, told by the one it happened to.',
        lookFor: 'Honesty over drama; Christ at the center, not the story; others protected by name and consent.', length: '400–3,000 words',
        avoid: 'The sin told in more detail than the Saviour; other people named without their consent; a story still too raw to be told well.', sample: 'The year the business failed, and how I learned who had been providing all along.' },
      { value: 'deliverance', name: 'Deliverance story', plural: 'Deliverance stories', pillar: 'perimeter',
        what: 'An account of freedom from what was binding: the fight, the turning, and what came after.',
        lookFor: 'Sobriety and care; no sensationalism; Scripture handled faithfully; the long road after, not only the moment.', length: '500–4,000 words',
        avoid: 'Sensational detail; methods offered as formulas; claims about the spiritual state of other people.', sample: 'What held me for eleven years, the afternoon it broke, and the two years of ordinary obedience that followed.' },
      { value: 'recovery', name: 'Recovery story', plural: 'Recovery stories', pillar: 'perimeter',
        what: 'The long road back from addiction, grief, abuse or despair, and what holds on it.',
        lookFor: 'Truthfulness about the hard parts; hope that is earned; nothing that could harm a reader in the same place.', length: '500–4,000 words',
        avoid: 'Advice in place of an account; a clean ending the facts do not support; detail that could tempt a reader in the same place.', sample: 'Ninety days sober: what the mornings were like, and what held.' },
      { value: 'personal', name: 'Personal', plural: 'Personal accounts', pillar: 'perimeter',
        what: 'Encounters, dreams and experiences of the unseen that do not fit the other three.',
        lookFor: 'Humility about what you saw; discernment tested against Scripture; plainness of speech.', length: '300–2,500 words',
        avoid: 'Certainty about what an experience meant; new teaching built on a dream; anything not yet tested against Scripture and wise counsel.', sample: 'A dream I had three times, what I did with it, and how I tested it.' },
    ],
  },
];
export const KINDS: Kind[] = ROOMS.flatMap((r) => r.kinds);
