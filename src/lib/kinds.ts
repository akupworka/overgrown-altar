// Every kind of work the Guild publishes, room by room: what it is, what the editor looks for, and a rough length.
// Used by the Forms page (/forms/) and the Archive filters. The Desk's choices come from lib/supabase.ts (MEDIUMS).
export type PillarId = 'watchtower' | 'hearth' | 'perimeter';
export interface Kind { value: string; name: string; plural: string; pillar: PillarId; what: string; lookFor: string; length: string }
export interface Room { id: PillarId; name: string; line: string; kinds: Kind[] }

export const ROOMS: Room[] = [
  {
    id: 'watchtower', name: 'The Watchtower', line: 'Essays that take a great secular mind seriously, find where it fractured, and set the anchor.',
    kinds: [
      { value: 'essay', name: 'Essay / Dispatch', plural: 'Essays', pillar: 'watchtower',
        what: 'A long-form essay or cultural audit. It names a thinker, an idea or an idol of the age, finds where it fractured, and anchors it again in Christ.',
        lookFor: 'A real argument fairly made; the opposing mind given its due; sources honestly cited; prose that is clear before it is clever.',
        length: '1,500–5,000 words' },
    ],
  },
  {
    id: 'hearth', name: 'The Hearth', line: 'The creative room: work made with reverence and brought to the fire to be read.',
    kinds: [
      { value: 'prose', name: 'Prose', plural: 'Prose', pillar: 'hearth',
        what: 'Short non-fiction from the heart: reflections, meditations, letters, small essays of place and memory.',
        lookFor: 'One true thing, carefully seen; restraint; an ending that earns its quiet.', length: '400–2,000 words' },
      { value: 'poetry', name: 'Poetry', plural: 'Poems', pillar: 'hearth',
        what: 'Poems, psalms and songs in any form, from strict meter to free verse.',
        lookFor: 'Every line doing work; images that are seen, not borrowed; sound read aloud before it is sent.', length: 'Any length; most under 60 lines' },
      { value: 'fiction', name: 'Fiction', plural: 'Fiction', pillar: 'hearth',
        what: 'Short stories, flash fiction and self-contained chapters that tell the truth slant.',
        lookFor: 'A story that moves; characters with weight; grace that is not sentimental.', length: '500–6,000 words' },
      { value: 'photograph', name: 'Photographs', plural: 'Photographs', pillar: 'hearth',
        what: 'Dark, atmospheric photography: stone in monochrome, color through glass. A single image or a short series with a few lines of context.',
        lookFor: 'A considered eye; light used as meaning; images at least 1600 pixels wide, your own.', length: '1–12 images' },
      { value: 'study', name: 'Architectural study', plural: 'Architectural studies', pillar: 'hearth',
        what: 'A close reading of sacred or significant space: a window, a nave, a doorway, a ruin.',
        lookFor: 'Looking long at one place; history worn lightly; what the building is saying about God and man.', length: '800–3,000 words, with photographs' },
      { value: 'teardown', name: 'Design teardown', plural: 'Design teardowns', pillar: 'hearth',
        what: 'An original design taken apart: how a made thing works, why it moves us, and what it believes.',
        lookFor: 'Specific observation over opinion; images that show the point; craft respected even when critiqued.', length: '800–3,000 words, with images' },
    ],
  },
  {
    id: 'perimeter', name: 'The Perimeter', line: 'Testimony from the edge of the unseen, told honestly and anchored in Christ.',
    kinds: [
      { value: 'testimony', name: 'Testimony', plural: 'Testimonies', pillar: 'perimeter',
        what: 'What God has done, told by the one it happened to.',
        lookFor: 'Honesty over drama; Christ at the center, not the story; others protected by name and consent.', length: '600–3,000 words' },
      { value: 'deliverance', name: 'Deliverance story', plural: 'Deliverance stories', pillar: 'perimeter',
        what: 'An account of freedom from what was binding: the fight, the turning, and what came after.',
        lookFor: 'Sobriety and care; no sensationalism; Scripture handled faithfully; the long road after, not only the moment.', length: '800–4,000 words' },
      { value: 'recovery', name: 'Recovery story', plural: 'Recovery stories', pillar: 'perimeter',
        what: 'The long road back from addiction, grief, abuse or despair, and what holds on it.',
        lookFor: 'Truthfulness about the hard parts; hope that is earned; nothing that could harm a reader in the same place.', length: '800–4,000 words' },
      { value: 'personal', name: 'Personal', plural: 'Personal accounts', pillar: 'perimeter',
        what: 'Encounters, dreams and experiences of the unseen that do not fit the other three.',
        lookFor: 'Humility about what you saw; discernment tested against Scripture; plainness of speech.', length: '400–2,500 words' },
    ],
  },
];
export const KINDS: Kind[] = ROOMS.flatMap((r) => r.kinds);
