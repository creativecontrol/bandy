/**
 * Arrays of all 12 pitch classes in sharps and flats
 * Used mainly for conversion of midi notes to note names
 */
const NOTES = { // eslint-disable-line no-unused-vars
  sharps: ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'],
  flats: ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'],
};

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
        note: 'g',
        octave: 3,
        midiNote: 55,
      },
      high: {
        note: 'a',
        octave: 7,
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
        note: 'c',
        octave: 3,
        midiNote: 48,
      },
      high: {
        note: 'e',
        octave: 6,
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
        note: 'c',
        octave: 2,
        midiNote: 36,
      },
      high: {
        note: 'c',
        octave: 6,
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
        note: 'e',
        octave: 2,
        midiNote: 40,
      },
      high: {
        note: 'c',
        octave: 5,
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
        note: 'e',
        octave: 3,
        midiNote: 52,
      },
      high: {
        note: 'b',
        octave: 5,
        midiNote: 83,
      },
    },
    clef: 'treble',
    accidentals: 'sharps',
    transposition: 'none',
  },
};
