// The sample articles from the design, ready to load into Sanity with `npm run seed`.
// Images are files in /public/images. After seeding, edit everything in the Studio.

let k = 0;
const key = () => `k${(k++).toString(36)}`;
const p = (text, style = 'normal') => ({ _type: 'block', _key: key(), style, markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] });
const h = (text) => p(text, 'h2');

export const author = {
  _id: 'author-ainslie-willson', _type: 'author', name: 'Ainslie Willson',
  slug: { _type: 'slug', current: 'ainslie-willson' }, craft: 'Editor · Essayist',
};

const DATE = '2026-11-03T09:00:00Z';
const a = (o) => ({ _type: 'article', publishedAt: DATE, signed: true, thinkers: [], inMatrix: false, ...o });

// Sample dates a week apart (Dispatch 1 oldest). Change any date in the Studio.
const weekly = (n) => new Date(Date.UTC(2026, 8, 22 + (n - 1) * 7, 9)).toISOString();

export const articles = [
  // ---------------- The Watchtower ----------------
  a({
    _id: 'article-nietzsche-surrendered', pillar: 'watchtower', medium: 'essay', number: 1, publishedAt: weekly(1),
    title: 'Nietzsche Surrendered: The Übermensch at the Foot of the Cross', slug: 'nietzsche-surrendered',
    standfirst: 'Friedrich Nietzsche correctly diagnosed the spiritual rot and passive nihilism of modern society, but his solution—the Übermensch (Overman)—was an exercise in human pride that collapsed into madness.',
    image: ['format-dispatches.jpg', 'Stone cross wrapped in ivy'], thinkers: ['nietzsche'],
    inMatrix: true, matrixThinker: 'Nietzsche’s Will to Power', matrixFracture: 'Self-Exaltation & Madness', matrixAnchor: 'Surrender & Divine Authority',
    body: [
      h('The Secular Defect'),
      p('Friedrich Nietzsche correctly diagnosed the spiritual rot and passive nihilism of modern society, but his solution—the Übermensch (Overman)—was an exercise in human pride that collapsed into madness. He wanted man to create his own meaning through sheer will.'),
      { _type: 'plate', _key: key(), shape: 'arch', alt: 'Window of the Ascension and the Crucifixion', file: 'window-of-the-ascension-and.jpg' },
      h('The Biblical Anchor'),
      p('What happens when Nietzsche’s fire is surrendered to God? The Übermensch becomes the crucified and resurrected believer. True power is not self-exaltation; it is dying to the self to inherit divine authority. The drive to transcend human weakness is satisfied only through the Holy Spirit, not the fragile ego.'),
      { _type: 'pullQuote', _key: key(), text: 'True power is not self-exaltation; it is dying to the self to inherit divine authority.' },
      h('The Fire Surrendered'),
      p('Nietzsche announced that God was dead and that we had killed Him. He was honest enough to tremble at what he had said. If there is no God, then every value must be forged again by the will alone, and the man strong enough to forge them must stand above the rest of us. It is a heroic picture. It is also a lonely one, and it ended in Turin in January of 1889, when the philosopher of the will collapsed and never wrote again.'),
      p('The tragedy is not that Nietzsche wanted too much. It is that he wanted the right thing by the wrong road. He longed for a humanity that would overcome itself, that would rise above resentment, mediocrity and fear. Scripture longs for the same thing and names the road: not the exaltation of the self but its crucifixion. The Son did not grasp at equality with God but emptied Himself, and was therefore exalted above every name.'),
      p('Here is the Overman surrendered. The believer who is crucified with Christ does not lose the fire Nietzsche saw; he receives it from Another. The will is not abolished but bowed, and what rises from that grave is not a superman made by his own hands but a son raised by his Father. That is the only transcendence that does not end in madness, because it is the only one that does not depend on us.'),
      { _type: 'scripture', _key: key(), text: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me.', reference: 'Galatians ii · xx' },
    ],
  }),
  a({
    _id: 'article-jung-vs-tolkien', pillar: 'watchtower', medium: 'essay', number: 2, publishedAt: weekly(2),
    title: 'Jung vs. Tolkien: The Counterfeit Unconscious vs. Myth Realized', slug: 'jung-vs-tolkien',
    standfirst: 'Jung found the old myths in the depths of the psyche. Tolkien knew the True Myth had stepped into history.',
    image: ['window-of-the-ascension-and.jpg', 'Window of the Ascension and the Crucifixion'], thinkers: ['jung'],
    inMatrix: true, matrixThinker: 'Jung’s Archetypal Psyche', matrixFracture: 'God as a Mind-Projection', matrixAnchor: 'The True Myth Made Flesh',
  }),
  a({
    _id: 'article-newtonian-determinism', pillar: 'watchtower', medium: 'essay', number: 3, publishedAt: weekly(3),
    title: 'Newtonian Determinism: The Missing Anchor', slug: 'newtonian-determinism',
    standfirst: 'A universe of perfect laws, and no Lawgiver to keep them. Where the clockwork worldview runs down.',
    image: ['folios-photo-2.jpg', 'Vaulted nave with stained-glass windows'], thinkers: ['newton'],
    inMatrix: true, matrixThinker: 'Newtonian Mechanics', matrixFracture: 'Closed, Sterile Materialism', matrixAnchor: 'Colossians 1:17 Coherence',
  }),
  a({
    _id: 'article-resurrection-quantum-law', pillar: 'watchtower', medium: 'essay', number: 4, publishedAt: weekly(4),
    title: 'The Resurrection as the Primary Quantum Law', slug: 'resurrection-quantum-law',
    standfirst: 'Decay is not the deepest law of the universe. The empty tomb is.',
    image: ['folios-photo.jpg', 'Painted dome seen from below'], thinkers: ['quantum'],
    inMatrix: true, matrixThinker: 'Quantum Paradox & Entropy', matrixFracture: 'Absurd, Random Matter', matrixAnchor: 'Resurrection Re-encryption',
  }),
  a({
    _id: 'article-freuds-couch', pillar: 'watchtower', medium: 'essay', number: 5, publishedAt: weekly(5),
    title: 'Freud’s Couch and the Confessional', slug: 'freuds-couch-and-the-confessional',
    standfirst: 'The talking cure found the wound. It could not pronounce the absolution.',
    image: ['watchtower-photo.jpg', 'A dim side chapel with a crucifix'], thinkers: ['freud'],
  }),
  a({
    _id: 'article-bukowski', pillar: 'watchtower', medium: 'essay', number: 6, publishedAt: weekly(6),
    title: 'Bukowski and the Liturgy of Despair', slug: 'bukowski-and-the-liturgy-of-despair',
    standfirst: 'A poet who worshipped his own ruin, and the grace he kept walking past.',
    image: ['what-we-believe.jpg', 'A lone figure in the pews of a stone church'], thinkers: ['bukowski'],
  }),
  a({
    _id: 'article-algorithm-as-idol', pillar: 'watchtower', medium: 'essay', number: 7, publishedAt: weekly(7),
    title: 'The Algorithm as Idol', slug: 'the-algorithm-as-idol',
    standfirst: 'Digital posturing, the curated self, and the God who sees in secret.',
    image: ['watchtower-photo-2.jpg', ''],
  }),

  // ---------------- The Hearth ----------------
  a({
    _id: 'article-four-lancets-at-dusk', pillar: 'hearth', medium: 'photograph',
    title: 'Four Lancets at Dusk', slug: 'four-lancets-at-dusk',
    standfirst: 'Stone in monochrome. Color only through glass.',
    image: ['four-lancet-window.jpg', 'Four-lancet stained-glass window'],
  }),
  a({
    _id: 'article-vespers', pillar: 'hearth', medium: 'prose',
    title: 'Vespers in a Roofless Nave', slug: 'vespers-in-a-roofless-nave',
    standfirst: 'An evening in a ruined abbey, and the psalms the stones still seem to keep.',
    image: ['pillar-perimeter.jpg', 'A stone church beneath bare trees'],
  }),
  a({
    _id: 'article-bellringers-daughter', pillar: 'hearth', medium: 'fiction',
    title: 'The Bellringer’s Daughter', slug: 'the-bellringers-daughter',
    standfirst: 'A short story about a village that silenced its bells, and the girl who would not.',
    image: ['archive-photo.jpg', 'Candles before a rose window'],
  }),
  a({
    _id: 'article-lancet-points-upward', pillar: 'hearth', medium: 'study',
    title: 'Why the Lancet Points Upward', slug: 'why-the-lancet-points-upward',
    standfirst: 'Gothic geometry as theology: how a window teaches the eye to pray.',
    image: ['bay-window-of-stained-glass.jpg', 'A bay window of stained glass'],
  }),
  a({
    _id: 'article-book-of-kells', pillar: 'hearth', medium: 'teardown',
    title: 'The Book of Kells and the Discipline of the Margin', slug: 'the-book-of-kells',
    standfirst: 'What a ninth-century scriptorium knows about attention that we have forgotten.',
    image: ['archive-photo-2.jpg', 'Detail of a rose window'],
  }),

  // ---------------- The Perimeter ----------------
  a({
    _id: 'article-legal-audits', pillar: 'perimeter', medium: 'protocol', number: 1,
    title: 'Legal audits', slug: 'legal-audits',
    standfirst: 'An orderly review of the agreements, debts and contracts that carry your name, so nothing binds you that you did not choose with clear eyes.',
    image: ['stone.jpg', 'Stone'],
  }),
  a({
    _id: 'article-breaking-soul-ties', pillar: 'perimeter', medium: 'protocol', number: 2,
    title: 'Breaking soul ties', slug: 'breaking-soul-ties',
    standfirst: 'Naming the unhealthy bonds of past relationships, renouncing them before God, and walking free of their pull.',
    image: ['ivy.jpg', 'Ivy'],
  }),
  a({
    _id: 'article-untangling-mental-strongholds', pillar: 'perimeter', medium: 'protocol', number: 3,
    title: 'Untangling mental strongholds', slug: 'untangling-mental-strongholds',
    standfirst: 'Identifying the lies that have hardened into thought patterns and bringing every one of them under the obedience of Christ.',
    image: ['untangling-mental-strongholds.jpg', 'Untangling mental strongholds'],
    body: [
      p('For anyone who knows the thought that keeps winning: the old accusation, the fear that will not leave, the voice that sounds like your own. This manual walks through five movements for bringing it under the obedience of Christ.', 'lede'),
      { _type: 'protocolStep', _key: key(), title: 'Name the stronghold',
        intro: 'A stronghold is a lie that has hardened into a way of thinking. Before it can be pulled down, it has to be named plainly and without shame.',
        checklist: ['Write the recurring thought down, word for word.', 'Note when it speaks loudest: the time, the place, the trigger.', 'Ask what it claims about God, about you, and about others.'],
        scripture: 'Bringing into captivity every thought to the obedience of Christ. · 2 Corinthians x · v' },
      { _type: 'protocolStep', _key: key(), title: 'Bring it into the light',
        intro: 'What stays hidden keeps its power. Confession breaks the secrecy a stronghold depends on.',
        checklist: ['Bring what you have written to God in prayer, out loud.', 'Tell one trusted, mature believer what you have named.', 'Let them pray with you, and receive it.'],
        scripture: 'If we walk in the light, as he is in the light, we have fellowship one with another. · 1 John i · vii' },
      { _type: 'protocolStep', _key: key(), title: 'Renounce and replace',
        intro: 'A lie is not only refused; it is replaced. Answer it with what God has actually said.',
        checklist: ['Renounce the lie by name, in the authority of Christ.', 'Find the passage of Scripture that answers it directly.', 'Write that truth where the old thought used to win.'],
        scripture: 'And ye shall know the truth, and the truth shall make you free. · John viii · xxxii' },
      { _type: 'protocolStep', _key: key(), title: 'Establish the new boundary',
        intro: 'Freedom has to be guarded. Decide in advance what you will no longer let in.',
        checklist: ['Identify the voices, habits and places that fed the lie.', 'Choose one concrete limit for each, and tell someone.', 'Plan what you will do instead when the old pull returns.'],
        scripture: 'Keep thy heart with all diligence; for out of it are the issues of life. · Proverbs iv · xxiii' },
      { _type: 'protocolStep', _key: key(), title: 'Keep watch',
        intro: 'Strongholds rarely fall in a day. Walls are rebuilt the same way they were taken: one stone at a time, under watch.',
        checklist: ['Return to your written truth every morning for forty days.', 'Keep a short record of each victory, however small.', 'If the battle exceeds you, seek pastoral and professional help without shame.'],
        scripture: 'Be sober, be vigilant. · 1 Peter v · viii' },
    ],
  }),
  a({
    _id: 'article-firm-boundaries', pillar: 'perimeter', medium: 'protocol', number: 4,
    title: 'Establishing firm personal and spiritual boundaries', slug: 'establishing-firm-boundaries',
    standfirst: 'Learning where your yes and your no belong, and keeping the gate of your heart with diligence.',
    image: ['format-guild.jpg', 'A candlelit sanctuary'],
  }),
];
