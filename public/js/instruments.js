/**
 * Arrays of all 12 pitch classes in sharps and flats
 * Used mainly for conversion of midi notes to note names
 */
const NOTES = { // eslint-disable-line no-unused-vars
  sharps: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
  flats: ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'],
};

const ENTIRE_NOTE_RANGE = [ // eslint-disable-line no-unused-vars
  'a0', 'a#0', 'b0',
  'c1', 'c#1', 'd1', 'd#1', 'e1', 'f1', 'f#1', 'g1', 'g#1', 'a1', 'a#1', 'b1',
  'c2', 'c#2', 'd2', 'd#2', 'e2', 'f2', 'f#2', 'g2', 'g#2', 'a2', 'a#2', 'b2',
  'c3', 'c#3', 'd3', 'd#3', 'e3', 'f3', 'f#3', 'g3', 'g#3', 'a3', 'a#3', 'b3',
  'c4', 'c#4', 'd4', 'd#4', 'e4', 'f4', 'f#4', 'g4', 'g#4', 'a4', 'a#4', 'b4',
  'c5', 'c#5', 'd5', 'd#5', 'e5', 'f5', 'f#5', 'g5', 'g#5', 'a5', 'a#5', 'b5',
  'c6', 'c#6', 'd6', 'd#6', 'e6', 'f6', 'f#6', 'g6', 'g#6', 'a6', 'a#6', 'b6',
  'c7', 'c#7', 'd7', 'd#7', 'e7', 'f7', 'f#7', 'g7', 'g#7', 'a7', 'a#7', 'b7',
  'c8',
];

/**
 * RESTNOTE is the center line of a stave where a rest should be positioned
 * Organized by clef
 */
const RESTNOTE = { // eslint-disable-line no-unused-vars
  treble: 'b/4',
  alto: 'c/4',
  tenor: 'a/3',
  bass: 'd/3',
  subbass: 'd/2',
};

/**
 * Definitions of instruments and their standard orchestral ranges
 */
const INSTRUMENTS = { // eslint-disable-line no-unused-vars
  midi: {
    range: 'all',
    clef: 'none',
    accidentals: 'none',
    transposition: 'none',
  },
  violin: {
    range: {
      low: {
        noteName: 'g3',
        midiNote: 55,
      },
      high: {
        noteName: 'a7',
        midiNote: 105,
      },
    },
    clef: 'treble',
    accidentals: 'sharps',
    transposition: 'none',
  },
  viola: {
    range: {
      low: {
        noteName: 'c3',
        midiNote: 48,
      },
      high: {
        noteName: 'e6',
        midiNote: 88,
      },
    },
    clef: 'alto',
    accidentals: 'sharps',
    transposition: 'none',
  },
  cello: {
    range: {
      low: {
        noteName: 'c2',
        midiNote: 36,
      },
      high: {
        noteName: 'c6',
        midiNote: 84,
      },
    },
    clef: 'bass',
    accidentals: 'sharps',
    transposition: 'none',
  },
  bass: {
    range: {
      low: {
        noteName: 'e2',
        midiNote: 40,
      },
      high: {
        noteName: 'c5',
        midiNote: 72,
      },
    },
    clef: 'subbass',
    accidentals: 'sharps',
    transposition: 'none',
  },
  guitar: {
    range: {
      low: {
        noteName: 'e3',
        midiNote: 52,
      },
      high: {
        noteName: 'b5',
        midiNote: 83,
      },
    },
    clef: 'treble',
    accidentals: 'sharps',
    transposition: 'none',
  },
  custom: {
    range: {
      low: {
        noteName: '',
        midiNote: 0,
      },
      high: {
        noteName: '',
        midiNote: 0,
      },
    },
    clef: '',
    accidentals: 'sharps',
    transposition: 'none',
  }
};
