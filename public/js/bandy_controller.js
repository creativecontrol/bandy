/**
 * TODO:
 *
 */

const MAPPING_8 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7};
// const MAPPING_4 = {0: 0, 1: 2, 2: 5, 3: 7};
// const BUTTONS_DEVICE = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

let OCTAVES = 7;
// let NUM_BUTTONS = 8;
const BUTTON_MAPPING = MAPPING_8;

console.debugging = false;

console.debug = (...args) => {
  if (!console.debugging) return;
  console.log.apply(this, args);
};

/**
 *
 */
class BandyController {
  /**
   *
   */
  constructor() {
    this.activateMidiAction = document.getElementById('activateMidi');
    this.midiInitButton = document.getElementById('midiInactive');
    this.midiUI = document.getElementById('midiActive');
    this.inputMenu = document.getElementById('midiInSelect');
    this.outputMenu = document.getElementById('midiOutSelect');
    this.currentInput = null;
    this.curretOutput = null;

    this.settingsModal = document.querySelector('#settingsBox');
    this.settingsAction = document.querySelector('#settings');
    this.settingsCloseAction = document.querySelector('#closeSettings');
    this.ballSpeedSetting = document.querySelector('#ballSpeed');
    this.noEventInfoSetting = document.querySelector('#noEventInfo');
    this.eventInfoSetting = document.querySelector('#eventInfo');
    this.eventURLSetting = document.querySelector('#eventURL');
    this.projectWebsiteSetting = document.querySelector('#projectWebsite');
    this.helpURLSetting = document.querySelector('#helpURL');
    this.roomIsLiveSetting = document.querySelector('#isLive');
    this.updateSettingsAction = document.querySelector('#storeSettings');
    this.clearPlayersAction = document.querySelector('#clearPlayers');
    this.clearStatsAction = document.querySelector('#clearStats');

    this.playerCount = document.querySelector('#playerCount');

    this.headerSize = 60;

    this.eventInfo = '';
    this.ballSpeed;
    this.isLive;

    this.keyWhitelist;
    this.TEMPERATURE = this.getTemperature();

    this.heldButtonToVisualData = new Map();

    // Which notes the pedal is sustaining.
    this.sustaining = false;
    this.sustainingNotes = [];

    this.room = 'LiveRoom';

    this.player = new Player();
    this.currentNumberOfPlayers = 10000;
    this.genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
    this.painter = new FloatyNotes(this.headerSize);
    this.piano = new Piano();

    // Attach to firebase database
    firebase.auth().signInAnonymously()
        .then(() => {
          this.connectToDatabase();
          this.copySettingsToUI();
          this.genie.initialize().then(() => {
            console.log('🧞‍♀️ ready!');
            this.run();
          });
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(`${errorCode} ${errorMessage}`);
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
    // this.updateButtonText();
    window.requestAnimationFrame(() => this.painter.drawLoop());

    // Event listeners.

    this.ballSpeedSetting.onchange = () => {
      this.ballSpeed = this.ballSpeedSetting.value;
    };
    this.noEventInfoSetting.onchange = () => {
      this.noEventInfo = this.noEventInfoSetting.value;
    };
    this.eventInfoSetting.onchange = () => {
      this.eventInfo = this.eventInfoSetting.value;
    };
    this.eventURLSetting.onchange = () => {
      this.eventURL = this.eventURLSetting.value;
    };
    this.projectWebsiteSetting.onchange = () => {
      this.projectWebsite = this.projectWebsiteSetting.value;
    };
    this.helpURLSetting.onchange = () => {
      this.helpURL = this.helpURLSetting.value;
    };
    this.roomIsLiveSetting.onchange = () => {
      this.isLive = this.roomIsLiveSetting.checked;
    };
    this.clearPlayersAction.onclick = () => {
      this.clearPlayers();
    };
    this.clearStatsAction.onclick = () => {
      this.clearStats();
    };
    this.updateSettingsAction.onclick = () => {
      this.updateSettings();
    };
    this.settingsAction.onclick = () => {
      this.settingsModal.hidden = !this.settingsModal.hidden;
    };

    this.settingsCloseAction.onclick = () => {
      this.settingsModal.hidden = !this.settingsModal.hidden;
    };

    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('orientationchange',
        this.onWindowResize.bind(this));
    // window.addEventListener('hashchange',
    //   () => TEMPERATURE = this.getTemperature());
  }

  /**
   *
   */
  connectToDatabase() {
    this.database = firebase.database();

    const settings = firebase.database().ref(`${this.room}/settings/`);
    settings.on('value', (snapshot) => {
      this.applySettingsFromDatabase(snapshot.val());
    });

    settings.onDisconnect().update({
      isLive: false,
    });

    const players = firebase.database().ref(`${this.room}/players/`);
    players.on('value', (snapshot) => {
      const playerStates = snapshot.val();
      this.applyPlayerStates(playerStates);
    });
  }

  /**
   *
   * @param {*} settings
   */
  applySettingsFromDatabase(settings) {
    this.ballSpeed = settings['ballStartSpeed'];
    this.isLive = settings['isLive'];
    this.numberOfPlayers = settings['numberOfPlayers'];
    this.noEventInfo = settings['noEventInfo'];
    this.eventInfo = settings['eventInfo'];
    this.eventURL = settings['eventURL'];
    this.projectWebsite = settings['projectWebsite'];
    this.helpURL = settings['helpURL'];

    this.playerCount.innerText = `Players: ${this.numberOfPlayers}`;

    this.copySettingsToUI();
  }

  /**
   *
   */
  copySettingsToUI() {
    this.ballSpeedSetting.value = this.ballSpeed;
    this.roomIsLiveSetting.checked = this.isLive;
    this.noEventInfoSetting.value = this.noEventInfo;
    this.eventInfoSetting.value = this.eventInfo;
    this.eventURLSetting.value = this.eventURL;
    this.projectWebsiteSetting.value = this.projectWebsite;
    this.helpURLSetting.value = this.helpURL;
  }

  /**
   *
   * @param {*} playerStates
   */
  applyPlayerStates(playerStates) {
    // parse through each of the players
    // if any button changes to 1 change it to 1
    // if all players' button X changes to 0 change to zero

    _.forEach(playerStates, (player, playerId) => {
      if (playerId != 'schema') {
        console.debug(`${playerId} ${player}`);
        _.forEach(player, (note, key) => {
          if (note == 1) {
            console.debug(`note ${key} on`);
            this.buttonDown(parseInt(key));
          } else if (note == 0) {
            console.debug(`note ${key} off`);
            this.buttonUp(parseInt(key));
          }
        });
      }
    });
    let numberOfPlayers;
    console.log(playerStates);
    if (playerStates === null) {
      numberOfPlayers = 0;
    } else {
      numberOfPlayers = _.size(playerStates);
    }
    if (numberOfPlayers != this.currentNumberOfPlayers) {
      this.updateNumberOfPlayers(numberOfPlayers);
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
  clearPlayers() {
    const players = this.database.ref(`${this.room}/players/`);
    const result =
      confirm('Are you sure you want to remove all players from the database?');
    if (result) {
      players.remove();
      this.updateNumberOfPlayers(0);
    } else {
    }
  }

  /**
   *
   */
  clearStats() {
    const initStatPath = `${this.room}/stats/initialGame/`;
    const changeStatPath = `${this.room}/stats/changeTo/`;

    const result =
      confirm('Are you sure you want to zero out statistics from the database?');
    if (result) {
      this.database.ref(`${initStatPath}paddle`).set(0);
      this.database.ref(`${initStatPath}tombola`).set(0);
      this.database.ref(`${changeStatPath}paddle`).set(0);
      this.database.ref(`${changeStatPath}tombola`).set(0);
    } else {
    }
  }
  /**
   *
   */
  updateSettings() {
    const settings = this.database.ref(`${this.room}/settings/`);

    settings.update(
        {
          'ballStartSpeed': this.ballSpeed,
          'noEventInfo': this.noEventInfo,
          'eventInfo': this.eventInfo,
          'eventURL': this.eventURL,
          'projectWebsite': this.projectWebsite,
          'helpURL': this.helpURL,
          'isLive': this.isLive,
        },
    );
  }

  /**
   *
   * @param {*} button
   * @param {*} fromKeyDown
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
      // Starting 3 semitones up on small screens (on a C),
      // and a whole octave up.
      return i + 3 + CONSTANTS.NOTES_PER_OCTAVE;
    });

    this.piano.resize(totalWhiteNotes);
    this.painter.resize(this.piano.config.whiteNoteHeight);
    this.piano.draw();
  }

  /**
   *
   * @return {float} newTemp
   */
  getTemperature() {
    const hash = parseFloat(this.parseHashParameters()['temperature']) || 0.25;
    const newTemp = Math.min(1, hash);
    console.log('🧞‍♀️ temperature = ', newTemp);
    return newTemp;
  }

  /**
   *
   * @return {*} params
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
          `<span>${i + 1}</span>`;
      // `<span>${i + 1}</span><br><span>${BUTTONS_DEVICE[i]}</span>`;
    }
  }
}

window.onload = () => {
  window.app = new BandyController();
};
