/**
 * bandy Performer
 * @todo add a check that high range is higher than low range and alert if it isn't
 * @todo autofill instrument params when selecting a new instrument
 * @todo add CSS for entry fields so they match style
 */

console.debugging = false;

console.debug = (...args) => {
  if (!console.debugging) return;
  console.log.apply(this, args);
};

/**
 *
 */
class BandyPerformer {
  /**
   *
   */
  constructor() {
    this.loginUI = document.querySelector('.login');
    this.setupUI = document.querySelector('.setup');
    this.contentUI = document.querySelector('.content');

    this.setupUICompleteAction = document.querySelector('#setupConfirm');

    this.settingsModal = document.querySelector('#settingsBox');
    this.settingsAction = document.querySelector('#settings');
    this.settingsCloseAction = document.querySelector('#closeSettings');
    this.eventURLSetting = document.querySelector('#eventURL');
    this.projectWebsiteSetting = document.querySelector('#projectWebsite');
    this.updateSettingsAction = document.querySelector('#storeSettings');

    this.playerCount = document.querySelector('#playerCount');

    // Performer settings fields in the Settings menu
    this.performerNameSetting =
      document.querySelector('#nameSetting');
    this.performerInstrumentNameSetting =
      document.querySelector('#instrumentSetting');
    this.performerInstrumentClefSetting =
      document.querySelector('#clefSetting');
    this.performerInstrumentTranspositionSetting =
      document.querySelector('#transpositionSetting');
    this.performerProbabilitySetting =
      document.querySelector('#probabilitySetting');
    this.performerRangeLowSetting =
      document.querySelector('#rangeLowSetting');
    this.performerRangeHighSetting =
      document.querySelector('#rangeHighSetting');
    this.performerAccidentalSetting;
    this.performerNoteNumberSetting;

    this.accidentalsAction = document.getElementsByName('accidentals');
    this.sharpsRadio = document.querySelector('#apSharpRadio');
    this.flatsRadio = document.querySelector('#apFlatRadio');
    this.numberOfNotesAction = document.getElementsByName('numberOfNotes');
    this.non5Radio = document.querySelector('#non5Radio');
    this.non6Radio = document.querySelector('#non6Radio');
    this.non7Radio = document.querySelector('#non7Radio');

    // Performer UI display
    this.performerNameUI =
      document.querySelector('#performerName');
    this.performerInstrumentUI =
      document.querySelector('#performerInstrument');
    this.performerProbabilityUI =
      document.querySelector('#performerProbability');
    this.midiUI = document.querySelector('.midi');
    this.midiInitButton = document.querySelector('#midiInactive');
    this.midiOutputSelector = document.querySelector('#midiOutputSelect');

    this.headerSize = 60;

    this.eventURL = '';
    this.projectWebsite = '';
    this.isLive;

    this.room = 'LiveRoom';
    this.performersPath = 'Performers';
    this.performerAuthInfo;

    this.databaseNotes;

    this.performerName = '';
    this.accidentalPreference = 'sharps';
    this.numberOfNotes = 6;
    this.noteLength = 'q';
    this.instrumentName = 'violin';
    this.instrumentClef = 'treble';
    this.instrumentTransposition = 'none';
    this.instrumentRange = {
      low: {
        noteName: 'g3',
        midiNote: 55,
      },
      high: {
        noteName: 'a7',
        midiNote: 105,
      },
    };
    this.probability = 1.0;
    this.fitNotesToRange = true;
    this.noteData = [];
    this.currentMidiOutput = '';
    this.lastNoteUpdate = [];

    this.VF = Vex.Flow;
    this.canvas = document.querySelector('#canvas');
    this.renderer;
    this.context;
    this.stavePercentOfCavnvas = 0.8;
    this.staveStartPadding = 40;

    // Initialize the FirebaseUI Widget using Firebase.
    this.ui = new firebaseui.auth.AuthUI(firebase.auth());
    this.setupLogin();
  }

  /**
   *
   */
  setupLogin() {
    this.ui.start('#firebaseui-auth-container', {
      callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          this.performerAuthInfo = authResult.user;
          this.loginUI.hidden = true;
          this.database = firebase.database();
          this.checkIfNewPerformer();
          // this.run();
          return false;
        },
        uiShown: function() {
          // What to do when the widget is rendered.

        },
      },
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID,
        firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
      ],
      // Terms of service url.
      tosUrl: '<your-tos-url>',
      // Privacy policy url.
      privacyPolicyUrl: '<your-privacy-policy-url>',
    });
  }

  /**
   *
   */
  checkIfNewPerformer() {
    // Check database to see if we have a UID that matches
    this.database.ref().child(this.performersPath)
        .child(this.performerAuthInfo.uid).get()
        .then((snapshot) => {
          if (snapshot.exists()) {
            console.log('performer exists');
            this.contentUI.hidden = false;
            this.connectToBandySettings();
            this.connectToPerformerSettings(true);
            this.run();
          } else {
            console.log('No data available');
            this.setupUI.hidden = false;
            this.performerNameSetting.value =
              this.performerAuthInfo.displayName;
            this.setupUICompleteAction.onclick = () => {
              this.setupUI.hidden = true;
              this.contentUI.hidden = false;
              this.settingsModal.hidden = false;
              this.connectToBandySettings();
              this.run();
            };
          }
        }).catch((error) => {
          console.error(error);
        });
  }

  /**
   * If the instrument type is MIDI
   * initialize the MIDI and display the output selector
   */
  initMidi() {
    WebMidi.enable((err) => {
      if (err) {
        console.log('WebMidi could not be enabled.', err);
        return;
      } else {
        console.log('WebMidi enabled!');
        for (const output of WebMidi.outputs) {
          const outputOption = document.createElement('option');
          outputOption.value = output.id;
          outputOption.textContent = output.name;
          this.midiOutputSelector.appendChild(outputOption);
        }
        this.onMidiOutputChange();
      }
    });
  }

  /**
   *
   */
  onMidiOutputChange() {
    const outputId = this.midiOutputSelector.value;
    if (outputId === 'internal') {
      this.currentMidiOutput = null;
    } else {
      this.currentMidiOutput = WebMidi.getOutputById(outputId);
    }
  }

  /**
   *
   */
  run() {
    // Settings
    this.buildInstrumentSettings();

    // draw the UI
    this.setCanvasSize();
    this.generateInitialNoteData();
    this.draw();

    // Get notes info
    this.connectToDatabaseNotes();

    // Event listeners.
    this.updateSettingsAction.onclick = () => {
      this.updateSettings();
      this.settingsModal.hidden = true;
    };
    this.settingsAction.onclick = () => {
      this.settingsModal.hidden = !this.settingsModal.hidden;
    };

    this.settingsCloseAction.onclick = () => {
      this.settingsModal.hidden = !this.settingsModal.hidden;
    };

    this.accidentalsAction.onclick = (event) => {
      this.performerAccidentalSetting = event.currentTarget.value;
    };

    this.numberOfNotesAction.onclick = (event) => {
      this.performerNoteNumberSetting = event.currentTarget.value;
    };

    window.onresize = () => {
      this.onWindowResize();
    };
    window.addEventListener('orientationchange', () => {
      this.onWindowResize();
    });
  }

  /**
   *
   */
  setCanvasSize() {
    this.canvas.width =
      this.canvas.parentElement.clientWidth * this.stavePercentOfCavnvas;
    this.canvas.height =
      this.canvas.parentElement.clientHeight - this.headerSize;
  }

  /**
   *
   */
  draw() {
    this.renderer = new this.VF.Renderer(this.canvas,
        this.VF.Renderer.Backends.CANVAS);
    this.renderer.resize(this.canvas.width, this.canvas.height);
    this.context = this.renderer.getContext();
    this.stave = this.drawStave();
    this.stave.draw();
    const notes = this.drawNotes(this.noteData);

    this.VF.Formatter.FormatAndDraw(this.context, this.stave, notes);
  }

  /**
   *
   */
  redraw() {
    this.context.clear();
    this.stave = this.drawStave();
    this.stave.draw();
    const notes = this.drawNotes(this.noteData);

    this.VF.Formatter.FormatAndDraw(this.context, this.stave, notes);
  }

  /**
   *
   * @return {*}
   */
  drawStave() {
    // Create a stave at position 10, 40
    const stave = new this.VF.Stave(10, 40, this.canvas.width,
        {left_bar: false});

    // Add a clef and time signature.
    stave.addClef('treble');
    stave.setNoteStartX(stave.getNoteStartX() + this.staveStartPadding);
    return stave.setContext(this.context);
  }

  /**
   *
   */
  generateInitialNoteData() {
    for (let i = 0; i<this.numberOfNotes; i++) {
      this.noteData.push({
        clef: this.instrumentClef,
        keys: [RESTNOTE[this.instrumentClef]],
        duration: `${this.noteLength}r`});
    }
  }
  /**
   *
   * @param {*} _notesData
   * @return {*}
   */
  drawNotes(_notesData) {
    const notes = [];
    for (const _note in _notesData) {
      if ({}.hasOwnProperty.call(_notesData, _note)) {
        const note = new this.VF.StaveNote(_notesData[_note]);
        const pitchClass = _notesData[_note].keys[0].slice(1, 2);
        if (pitchClass != '/') {
          note.addAccidental(0, new this.VF.Accidental(pitchClass));
        }
        notes.push(note);
      }
    };
    return notes;
  }

  /**
   * When a Note event comes in convert it from MIDI number
   * to note name and octave add the note to the noteData
   * @param {*} _note
   */
  addNote(_note) {
    const newNote = this.getNoteNameAndOctave(_note);
    // console.log(`new note: ${newNote}`);
    const newNoteFormat = {
      clef: this.instrumentClef,
      keys: [newNote],
      duration: this.noteLength,
      auto_stem: true,
    };
    this.noteData.push(newNoteFormat);

    // Pop the first note
    while (this.noteData.length > this.numberOfNotes) {
      this.noteData.shift();
    }
    this.redraw();
  }

  /**
   * Returns a name/octave from a midi note number
   * C4 = 60
   * @param {Number} midiNote
   * @return {String}
   */
  getNoteNameAndOctave(midiNote) {
    const octave = WebMidi.getOctave(midiNote);
    let name;
    if (this.accidentalPreference == 'sharps') {
      name = NOTES.sharps[midiNote%12];
    } else {
      name = NOTES.flats[midiNote%12];
    }
    return `${name}/${octave}`;
  }

  /**
   *
   */
  connectToBandySettings() {
    const settings = this.database.ref(`${this.room}/settings/`);
    settings.on('value', (snapshot) => {
      this.applyBandySettingsFromDatabase(snapshot.val());
    });
  }

  /**
   *
   * @param {boolean} firstLoad
   */
  connectToPerformerSettings(firstLoad) {
    // eslint-disable-next-line max-len
    const settings = this.database.ref(`${this.performersPath}/${this.performerAuthInfo.uid}/`);
    settings.on('value', (snapshot) => {
      if (firstLoad) {
        this.applyPerformerSettingsFromDatabase(snapshot.val(), true);
      } else {
        this.applyPerformerSettingsFromDatabase(snapshot.val());
      }
    });
  }


  /**
   *
   */
  connectToDatabaseNotes() {
    const notes = this.database.ref(`${this.room}/notes/`);
    notes.on('value', (snapshot) => {
      this.parseNotesFromDatabase(snapshot.val());
    });
  }

  /**
   * See what new notes have entered the database
   * and transform them for the instrument
   * @param {Array} _notes
   */
  parseNotesFromDatabase(_notes) {
    if (_notes && _notes.length > 0) {
      const incomingSlice = _notes.slice(this.numberOfNotes * -1);
      let lastNotes = [];
      if (this.lastNoteUpdate.slice(1)) {
        lastNotes = this.lastNoteUpdate.slice(1);
      } else {
        this.lastNotes = this.lastNoteUpdate;
      }
      let potentialNewNotes = incomingSlice.filter((note, index) => {
        console.debug(`note ${note} ${index} last note ${lastNotes[index]} `);
        return note != lastNotes[index];
      });
      console.debug(`incoming slice ${incomingSlice}\n` +
          `last note ${this.lastNoteUpdate}\n` +
          `potential notes ${potentialNewNotes}`);
      this.lastNoteUpdate = incomingSlice;

      // from potential new notes
      // filter for probability
      if (potentialNewNotes.length > 0) {
        potentialNewNotes = this.probabilityOfUsingNote(potentialNewNotes);
      }
      // filter for range and transposition
      if (potentialNewNotes.length > 0) {
        potentialNewNotes = this.rangeFilter(potentialNewNotes);
        if (this.instrumentTransposition &&
          this.instrumentTransposition != 'none') {
          // transpose the notes appropriately
        }
      }

      // Add new notes to the notes array to display
      if (potentialNewNotes.length > 0) {
        _.forEach(potentialNewNotes, (note) => {
          this.addNote(note);
        });
      }
    }
  }

  /**
   *
   * @param {Array} _notes
   * @return {Array}
   * @todo use a Perlin noise function here to create probability "waves" https://codepen.io/OliverBalfour/post/procedural-generation-part-1-1d-perlin-noise
   *
   */
  probabilityOfUsingNote(_notes) {
    const potentialNewNotes =[];
    _.forEach(_notes, (note) => {
      if (Math.random() < this.probability) {
        potentialNewNotes.push(note);
      }
    });

    return potentialNewNotes;
  }


  /**
   *
   * @param {Array} _notes
   * @return {Array}
   */
  rangeFilter(_notes) {
    const filteredNotes = [];
    if (this.instrumentRange == 'all') {
      _.forEach(_notes, (note) => {
        filteredNotes.push(note);
      });
    } else {
      const lowRange = this.instrumentRange.low.midiNote;
      const highRange = this.instrumentRange.high.midiNote;
      _.forEach(_notes, (note) => {
        // Either transpose notes into the range of the instrument
        // Or ignore notes that are outside of the range

        if (note >= lowRange && note <= highRange ) {
          filteredNotes.push(note);
        } else if (this.fitNotesToRange) {
          let newNote = note;
          const potentialNewNotes =[];
          let direction;
          if (note < lowRange) {
            direction = 12; // Add octaves
          } else if (note > highRange) {
            direction = -12; // subtract octaves
          }

          // transpose until it's in the range
          while (newNote < lowRange || newNote > highRange) {
            newNote += direction;
          };

          // come up with all options in range
          while (newNote >= lowRange && newNote <= highRange) {
            potentialNewNotes.push(newNote);
            newNote += direction;
          };

          // Randomly choose an option
          newNote = potentialNewNotes[Math.floor(
              Math.random()*potentialNewNotes.length)];
          filteredNotes.push(newNote);
        } else {
          // Ignore the note
        }
      });
    }
    return filteredNotes;
  }

  /**
   *
   */
  buildInstrumentSettings() {
    // Instrument names
    _.forEach(INSTRUMENTS, (instrument, key) => {
      const option = document.createElement('option');
      option.textContent = key;
      option.value = key;
      this.performerInstrumentNameSetting.appendChild(option);
    });

    // Clef options
    _.forEach(RESTNOTE, (clef, key) => {
      const option = document.createElement('option');
      option.textContent = key;
      option.value = key;
      this.performerInstrumentClefSetting.appendChild(option);
    });

    // Ranges
    _.forEach(ENTIRE_NOTE_RANGE, (note) => {
      const optionA = document.createElement('option');
      const optionB = document.createElement('option');

      optionA.textContent = optionB.textContent = note;
      optionA.value = optionB.value = note;
      this.performerRangeLowSetting.appendChild(optionA);
      this.performerRangeHighSetting.appendChild(optionB);
    });
  }

  /**
   *
   * @param {*} settings
   */
  applyBandySettingsFromDatabase(settings) {
    this.isLive = settings['isLive'];
    this.numberOfPlayers = settings['numberOfPlayers'];
    // this.eventInfo = settings['eventInfo'];
    this.eventURL = settings['eventURL'];
    this.projectWebsite = settings['projectWebsite'];
    // this.helpURL = settings['helpURL'];

    this.playerCount.innerText = `Players: ${this.numberOfPlayers}`;

    this.eventURLSetting.innerHTML = this.eventURL;
    this.projectWebsiteSetting.innerHTML = this.projectWebsite;
  }

  /**
   *
   * @param {*} settings
   */
  applyPerformerSettingsFromDatabase(settings, updateSettings=false) {
    // update local variables
    this.performerName = settings.name ? settings.name : '';
    this.instrumentName = settings.instrument ? settings.instrument : '';
    this.instrumentClef = settings.clef ? settings.clef : '';
    this.instrumentRange = settings.range ? settings.range : '';
    this.instrumentTransposition =
      settings.transposition ? settings.transposition : '';
    this.accidentalPreference =
      settings.accidentals ? settings.accidentals : 'sharps';
    this.numberOfNotes = settings.numberOfNotes ? settings.numberOfNotes : 6;
    this.probability = settings.probability ? settings.probability : 1.0;

    // update UI
    this.performerNameUI.innerText = this.performerName;
    this.performerInstrumentUI.innerText = this.instrumentName;
    this.performerProbabilityUI.innerText = `${this.probability * 100}%`;

    if (this.instrumentName == 'midi') {
      if (!WebMidi.enabled) {
        this.initMidi();
      }
      this.midiUI.hidden = false;
    } else {
      this.midiUI.hidden = true;
    }

    if (updateSettings) {
      // update settings menu
      this.performerNameSetting.value = this.performerName;
      this.performerInstrumentNameSetting.value = this.instrumentName;
      this.performerInstrumentClefSetting.value = this.instrumentClef;
      this.performerRangeLowSetting.value =
        _.has(this.instrumentRange, 'low.noteName') ?
        this.instrumentRange.low.noteName : '';
      this.performerRangeHighSetting.value =
        _.has(this.instrumentRange, 'high.noteName') ?
        this.instrumentRange.high.noteName : '';
      this.performerInstrumentTranspositionSetting.value =
        this.instrumentTransposition;
      this.performerAccidentalSetting = this.accidentalPreference;
      switch (this.performerAccidentalSetting) {
        case 'sharps':
          this.sharpsRadio.checked = true;
          break;
        case 'flats':
          this.flatsRadio.checked = true;
          break;
        default:
          this.sharpsRadio.checked = true;
          break;
      }
      this.performerNoteNumberSetting = this.numberOfNotes;
      switch (this.performerNoteNumberSetting) {
        case 5:
          this.non5Radio.checked = true;
          break;
        case 6:
          this.non6Radio.checked = true;
          break;
        case 7:
          this.non7Radio.checked = true;
          break;
        default:
          this.non6Radio.checked = true;
          break;
      }
      this.performerProbabilitySetting.value = this.probability * 100;
    }
  }

  /**
   *
   * @param {*} numberOfPlayers
   */
  updateNumberOfPlayers(numberOfPlayers) {
    const settings = this.database.ref(`${this.room}/settings/`);

    settings.update(
        {
          'numberOfPlayers': numberOfPlayers,
        },
    );

    this.currentNumberOfPlayers = numberOfPlayers;
  }

  /**
   *
   */
  updateSettings() {
    // store settings in the database
    this.database.ref().child(this.performersPath)
        .child(this.performerAuthInfo.uid)
        .set({
          name: this.performerNameSetting.value,
          instrument: this.performerInstrumentNameSetting.value,
          clef: this.performerInstrumentClefSetting.value,
          transposition: this.performerInstrumentTranspositionSetting,
          range: {
            low: {
              noteName: this.performerRangeLowSetting.value,
              midiNote:
                WebMidi.noteNameToNumber(this.performerRangeLowSetting.value),
            },
            high: {
              noteName: this.performerRangeHighSetting.value,
              midiNote:
                WebMidi.noteNameToNumber(this.performerRangeHighSetting.value),
            },
          },
          accidentalPreference: this.performerAccidentalSetting,
          numberOfNotes: this.performerNoteNumberSetting,
          probability: this.performerProbabilitySetting.value * 0.01,
        });
  }

  /**
   *
   */
  onWindowResize() {
    this.setCanvasSize();
    this.renderer.resize(this.canvas.width, this.canvas.height);
    this.context = this.renderer.getContext();
    this.redraw();
  }
} // End of BandyPerformer class

window.onload = () => {
  window.app = new BandyPerformer();
};
