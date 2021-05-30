/**
 * Arrays of all 12 pitch classes in sharps and flats.
 * Used mainly for conversion of midi notes to note names.
 *  @constant
 *  @type {Object}
 *  @default
 */
const NOTES = { // eslint-disable-line no-unused-vars
  sharps: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
  flats: ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'],
};

/**
 *  An array of all note names for a standard piano range.
 *  @constant
 *  @type {String[]}
 *  @default ['a0' ... 'c8']
 */
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
 * An array of possible transpositions
 * @constant
 * @type {Object[]}
 * @default [{semitones: <number>, interval: <string>}]
 */
const TRANSPOSITIONS = [ // eslint-disable-line no-unused-vars
  {semitones: 12, interval: 'P8'},
  {semitones: 11, interval: 'M7'},
  {semitones: 10, interval: 'm7'},
  {semitones: 9, interval: 'M6'},
  {semitones: 8, interval: 'm6'},
  {semitones: 7, interval: 'P5'},
  {semitones: 6, interval: 'TT'},
  {semitones: 5, interval: 'P4'},
  {semitones: 4, interval: 'M3'},
  {semitones: 3, interval: 'm3'},
  {semitones: 2, interval: 'M2'},
  {semitones: 1, interval: 'm2'},
  {semitones: 0, interval: 'P1'},
  {semitones: -1, interval: 'm2'},
  {semitones: -2, interval: 'M2'},
  {semitones: -3, interval: 'm3'},
  {semitones: -4, interval: 'M3'},
  {semitones: -5, interval: 'P4'},
  {semitones: -6, interval: 'TT'},
  {semitones: -7, interval: 'P5'},
  {semitones: -8, interval: 'm6'},
  {semitones: -9, interval: 'M6'},
  {semitones: -10, interval: 'm7'},
  {semitones: -11, interval: 'M7'},
  {semitones: -12, interval: 'P8'},
];

/**
 * RESTNOTE is the center line of a stave where a quarter rest should be positioned.
 * Organized by clef.
 *  @constant
 *  @type {Object}
 *  @default
 */
const RESTNOTE = { // eslint-disable-line no-unused-vars
  treble: 'b/4',
  alto: 'c/4',
  tenor: 'a/3',
  bass: 'd/3',
  subbass: 'd/2',
};

/**
 * Definitions of instruments and their standard orchestral ranges, clef,
 * accidentals, and transpositions.
 * @constant
 * @type {Object}
 * @default
 */
const INSTRUMENTS = { // eslint-disable-line no-unused-vars
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
    transposition: 0,
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
    transposition: 0,
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
    transposition: 0,
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
    transposition: 0,
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
    transposition: 0,
  },
  midi: {
    range: {
      low: {
        noteName: 'a0',
        midiNote: 21,
      },
      high: {
        noteName: 'c8',
        midiNote: 108,
      },
    },
    clef: 'none',
    accidentals: 'sharps',
    transposition: 0,
  },
  custom: {
    range: {
      low: {
        noteName: 'a0',
        midiNote: 21,
      },
      high: {
        noteName: 'c8',
        midiNote: 108,
      },
    },
    clef: 'treble',
    accidentals: 'sharps',
    transposition: 0,
  },
};
