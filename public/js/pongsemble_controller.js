/**
 * 
 */

const MAPPING_8 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7};
const MAPPING_4 = {0: 0, 1: 2, 2: 5, 3: 7};
const BUTTONS_DEVICE = ['a','s','d','f','j','k','l',';'];

let OCTAVES = 7;
let NUM_BUTTONS = 8;
let BUTTON_MAPPING = MAPPING_8;

/**
 * 
 */
class PongsembleController {
  /**
   *
   */
  constructor() {
    this.activateMidiAction = document.getElementById("activateMidi");
    this.midiInitButton = document.getElementById("midiInactive");
    this.midiUI = document.getElementById("midiActive");
    this.inputMenu = document.getElementById("midiInSelect");
    this.outputMenu = document.getElementById("midiOutSelect");
    this.currentInput = null;
    this.curretOutput = null;

    this.keyWhitelist;
    this.TEMPERATURE = this.getTemperature();

    this.heldButtonToVisualData = new Map();

    // Which notes the pedal is sustaining.
    this.sustaining = false;
    this.sustainingNotes = [];

    this.player = new Player();
    this.genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
    this.painter = new FloatyNotes();
    this.piano = new Piano();

    // Attach to firebase database
    firebase.auth().signInAnonymously()
        .then(() => {
          this.connectToDatabase();
          this.genie.initialize().then(() => {
            console.log('🧞‍♀️ ready!');
            this.run();
          });
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
        // ...
        });
  }

  /**
   *
   */
  run() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
          .then(
              (midi) => this.player.midiReady(midi),
              (err) => console.log('Something went wrong', err));
    } else {
      console.log('MIDI not supported');
    }
    // Start the drawing loop.
    this.onWindowResize();
    this.updateButtonText();
    window.requestAnimationFrame(() => this.painter.drawLoop());

    // Event listeners.
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('orientationchange',
        this.onWindowResize.bind(this));
    // window.addEventListener('hashchange', () => TEMPERATURE = this.getTemperature());
  }

  /**
   * 
   */
  connectToDatabase() {
    this.database = firebase.database();

    const players = firebase.database().ref('players/');
    players.on('value', (snapshot) => {
      const playerStates = snapshot.val();
      this.applyPlayerStates(playerStates);
    });
  }

  /**
   * 
   */
  applyPlayerStates(playerStates) {
    // parse through each of the players 
    // if any button changes to 1 change it to 1
    // if all players' button X changes to 0 change to zero
    _.forEach(playerStates, (player, playerId) => {
      if (playerId != 'schema') {
        console.log(`${playerId} ${player}`)
        _.forEach(player, (note, key) => {
          if (note == 1) {
            console.log(`note ${key} on`);
            this.buttonDown(parseInt(key));
          } else if (note == 0) {
            console.log(`note ${key} off`);
            this.buttonUp(parseInt(key));
          }
        });
      }
    });
  }

  /**
   *
   * @param {*} button 
   * @param {*} fromKeyDown 
   * @returns 
   */
  buttonDown(button, fromKeyDown) {
    // If we're already holding this button down, nothing new to do.
    if (this.heldButtonToVisualData.has(button)) {
      return;
    }

    const el = document.getElementById(`btn${button}`);
    if (!el) {
      return;
    }
    el.setAttribute('active', true);

    const note = this.genie.nextFromKeyWhitelist(BUTTON_MAPPING[button],
        this.keyWhitelist, this.TEMPERATURE);
    const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;

    // Hear it.
    this.player.playNoteDown(pitch, button);

    // See it.
    const rect = this.piano.highlightNote(note, button);

    if (!rect) {
      debugger;
    }
    // Float it.
    const noteToPaint = this.painter.addNote(button, rect.getAttribute('x'),
        rect.getAttribute('width'));
    this.heldButtonToVisualData.set(button, {rect: rect, note: note,
      noteToPaint: noteToPaint});
  }

  /**
   * 
   * @param {*} button 
   * @returns 
   */
  buttonUp(button) {
    const el = document.getElementById(`btn${button}`);
    if (!el) {
      return;
    }
    el.removeAttribute('active');

    const thing = this.heldButtonToVisualData.get(button);
    if (thing) {
      // Don't see it.
      this.piano.clearNote(thing.rect);

      // Stop holding it down.
      this.painter.stopNote(thing.noteToPaint);

      // Maybe stop hearing it.
      const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + thing.note;
      if (!this.sustaining) {
        this.player.playNoteUp(pitch, button);
      } else {
        this.sustainingNotes.push(CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE +
          thing.note);
      }
    }
    this.heldButtonToVisualData.delete(button);
  }


  /**
   *
   */
  onWindowResize() {
    OCTAVES = window.innerWidth > 700 ? 7 : 3;
    // starts on an A, ends on a C.
    const bonusNotes = OCTAVES > 6 ? 4 : 0;
    const totalNotes = CONSTANTS.NOTES_PER_OCTAVE * OCTAVES + bonusNotes;
    const totalWhiteNotes = CONSTANTS.WHITE_NOTES_PER_OCTAVE *
      OCTAVES + (bonusNotes - 1);
    this.keyWhitelist = Array(totalNotes).fill().map((x, i) => {
      if (OCTAVES > 6) return i;
      // Starting 3 semitones up on small screens (on a C), and a whole octave up.
      return i + 3 + CONSTANTS.NOTES_PER_OCTAVE;
    });

    this.piano.resize(totalWhiteNotes);
    this.painter.resize(this.piano.config.whiteNoteHeight);
    this.piano.draw();
  }

  /**
   * 
   * @returns 
   */
  getTemperature() {
    const hash = parseFloat(this.parseHashParameters()['temperature']) || 0.25;
    const newTemp = Math.min(1, hash);
    console.log('🧞‍♀️ temperature = ', newTemp);
    return newTemp;
  }

  /**
   * 
   * @returns 
   */
  parseHashParameters() {
    const hash = window.location.hash.substring(1);
    const params = {};
    hash.split('&').map((hk) => {
      const temp = hk.split('=');
      params[temp[0]] = temp[1];
    });
    return params;
  }

  /**
   *
   */
  updateButtonText() {
    const btns = document.querySelectorAll('.controls button.color');
    for (let i = 0; i < btns.length; i++) {
      btns[i].innerHTML =
          `<span>${i + 1}</span><br><span>${BUTTONS_DEVICE[i]}</span>`;
    }
  }
}

window.onload = () => {
  window.app = new PongsembleController();
};
