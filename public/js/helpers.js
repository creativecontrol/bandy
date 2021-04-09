const CONSTANTS = {
  COLORS: ['#EE2B29', '#ff9800', '#ffff00', '#c6ff00', '#00e5ff',
    '#2979ff', '#651fff', '#d500f9'],
  NUM_BUTTONS: 8,
  NOTES_PER_OCTAVE: 12,
  WHITE_NOTES_PER_OCTAVE: 7,
  LOWEST_PIANO_KEY_MIDI_NOTE: 21,
  GENIE_CHECKPOINT: 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',

};

/** ***********************
 * MIDI or Magenta player
 ************************/
class Player {
  /**
   *
   */
  constructor() {
    this.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
    this.midiOut = [];
    this.midiIn = [];
    this.usingMidiOut = true;
    this.usingMidiIn = false;
    this.selectOutElement = document.getElementById('selectOut');
    this.selectedOut = {};
    this.selectInElement = document.getElementById('selectIn');
    this.loadAllSamples();
  }

  /**
   *
   */
  loadAllSamples() {
    const seq = {notes: []};
    for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; i++) {
      seq.notes.push({pitch: CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + i});
    }
    this.player.loadSamples(seq);
  }

  /**
   *
   * @param {int} pitch
   * @param {*} button
   */
  playNoteDown(pitch, button) {
    // Send to MIDI out or play with the Magenta player.
    if (this.usingMidiOut && this.midiOut) {
      this.sendMidiNoteOn(pitch, button);
    } else {
      mm.Player.tone.context.resume();
      this.player.playNoteDown({pitch: pitch});
    }
  }

  /**
   *
   * @param {int} pitch
   * @param {*} button
   */
  playNoteUp(pitch, button) {
    // Send to MIDI out or play with the Magenta player.
    if (this.usingMidiOut && this.midiOut) {
      this.sendMidiNoteOff(pitch, button);
    } else {
      this.player.playNoteUp({pitch: pitch});
    }
  }

  /**
   * MIDI bits.
   * @param {*} midi
   */
  midiReady(midi) {
    // Also react to device changes.
    midi.addEventListener('statechange',
        (event) => {
          this.initDevices(event.target);
          if (this.selectedOut.name) {
            this.selectOutElement.value = this.selectedOut.name;
          }
        });
    this.initDevices(midi);
  }

  /**
   *
   * @param {*} midi
   */
  initDevices(midi) {
    this.midiOut = [];

    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done;
      output = outputs.next()) {
      this.midiOut.push(output.value);
    }

    this.selectOutElement.innerHTML = this.midiOut.map((device) =>
      `<option>${device.name}</option>`).join('');

    this.selectOutElement.onchange = () => {
      this.selectedOut.index = this.selectOutElement.selectedIndex;
      this.selectedOut.name =
        this.selectOutElement[this.selectedOut.index].value;
      // console.log(`selected Out: ${this.selectedOut.index}
      //   ${this.selectedOut.name}`);
    };
  }

  /**
   *
   * @param {*} pitch
   * @param {*} button
   */
  sendMidiNoteOn(pitch, button) {
    // -1 is sent when releasing the sustain pedal.
    if (button === -1) button = 0;
    // const msg = [0x90 + button, pitch, 0x7f];    // note on, full velocity.
    const msg = [0x90, pitch, 0x7f]; // note on, full velocity.
    this.midiOut[this.selectedOut.index].send(msg);
  }

  /**
   *
   * @param {*} pitch
   * @param {*} button
   */
  sendMidiNoteOff(pitch, button) {
    // -1 is sent when releasing the sustain pedal.
    if (button === -1) button = 0;
    // const msg = [0x80 + button, pitch, 0x7f];
    // note on, middle C, full velocity.
    const msg = [0x80, pitch, 0x7f]; // note on, middle C, full velocity.
    this.midiOut[this.selectedOut.index].send(msg);
  }

  /**
   *
   * @param {*} msg
   * @returns
   */
  getMIDIMessage(msg) {
    if (!this.usingMidiIn) {
      return;
    }
    const command = msg.data[0];
    const button = msg.data[1];
    // a velocity value might not be included with a noteOff command
    const velocity = (msg.data.length > 2) ? msg.data[2] : 0;

    switch (command) {
      case 0x90: // note on
        window.buttonDown(button, false);
        break;
      case 0x80: // note off
        window.buttonUp(button);
        break;
    }
  }
}

/** ***********************
 * Floaty notes
 ************************/
class FloatyNotes {
  /**
   *
   */
  constructor(headerSize = 0) {
    this.notes = []; // the notes floating on the screen.

    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.context.lineWidth = 4;
    this.context.lineCap = 'round';
    this.headerSize = headerSize;

    this.contextHeight = 0;
  }

  /**
   *
   * @param {*} whiteNoteHeight
   */
  resize(whiteNoteHeight) {
    this.canvas.width = window.innerWidth;
    this.canvas.height = this.contextHeight =
      window.innerHeight - whiteNoteHeight - 20 - this.headerSize;
  }

  /**
   *
   * @param {*} button
   * @param {*} x
   * @param {*} width
   * @returns
   */
  addNote(button, x, width) {
    const noteToPaint = {
      x: parseFloat(x),
      y: 0,
      width: parseFloat(width),
      height: 0,
      color: CONSTANTS.COLORS[button],
      on: true,
    };
    this.notes.push(noteToPaint);
    return noteToPaint;
  }

  /**
   *
   * @param {*} noteToPaint
   */
  stopNote(noteToPaint) {
    noteToPaint.on = false;
  }

  /**
   *
   */
  drawLoop() {
    const dy = 3;
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Remove all the notes that will be off the page;
    this.notes = this.notes.filter((note) => note.on ||
      note.y < (this.contextHeight - 100));

    // Advance all the notes.
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];

      // If the note is still on, then its height goes up but it
      // doesn't start sliding down yet.
      if (note.on) {
        note.height += dy;
      } else {
        note.y += dy;
      }

      this.context.globalAlpha = 1 - note.y / this.contextHeight;
      this.context.fillStyle = note.color;
      this.context.fillRect(note.x, note.y, note.width, note.height);
    }
    window.requestAnimationFrame(() => this.drawLoop());
  }
}

/**
 *
 */
class Piano {
  /**
   *
   */
  constructor() {
    this.config = {
      whiteNoteWidth: 20,
      blackNoteWidth: 20,
      whiteNoteHeight: 70,
      blackNoteHeight: 2 * 70 / 3,
    };

    this.svg = document.getElementById('svg');
    this.svgNS = 'http://www.w3.org/2000/svg';
  }

  /**
   *
   * @param {*} totalWhiteNotes
   */
  resize(totalWhiteNotes) {
    // i honestly don't know why some flooring is good and some is bad sigh.
    const ratio = window.innerWidth / totalWhiteNotes;
    this.config.whiteNoteWidth = OCTAVES > 6 ? ratio: Math.floor(ratio);
    this.config.blackNoteWidth = this.config.whiteNoteWidth * 2 / 3;
    this.svg.setAttribute('width', window.innerWidth);
    this.svg.setAttribute('height', this.config.whiteNoteHeight);
  }

  /**
   *
   */
  draw() {
    this.svg.innerHTML = '';
    const halfABlackNote = this.config.blackNoteWidth / 2;
    let x = 0;
    const y = 0;
    let index = 0;

    const blackNoteIndexes = [1, 3, 6, 8, 10];

    // First draw all the white notes.
    // Pianos start on an A (if we're using all the octaves);
    if (OCTAVES > 6) {
      this.makeRect(0, x, y, this.config.whiteNoteWidth,
          this.config.whiteNoteHeight,
          'white', '#141E30');
      this.makeRect(2, this.config.whiteNoteWidth, y,
          this.config.whiteNoteWidth, this.config.whiteNoteHeight,
          'white', '#141E30');
      index = 3;
      x = 2 * this.config.whiteNoteWidth;
    } else {
      // Starting 3 semitones up on small screens (on a C), and a whole octave up.
      index = 3 + CONSTANTS.NOTES_PER_OCTAVE;
    }

    // Draw the white notes.
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE; i++) {
        if (blackNoteIndexes.indexOf(i) === -1) {
          this.makeRect(index, x, y, this.config.whiteNoteWidth,
              this.config.whiteNoteHeight, 'white', '#141E30');
          x += this.config.whiteNoteWidth;
        }
        index++;
      }
    }

    if (OCTAVES > 6) {
      // And an extra C at the end (if we're using all the octaves);
      this.makeRect(index, x, y, this.config.whiteNoteWidth,
          this.config.whiteNoteHeight, 'white', '#141E30');

      // Now draw all the black notes, so that they sit on top.
      // Pianos start on an A:
      this.makeRect(1, this.config.whiteNoteWidth - halfABlackNote, y,
          this.config.blackNoteWidth, this.config.blackNoteHeight, 'black');
      index = 3;
      x = this.config.whiteNoteWidth;
    } else {
      // Starting 3 semitones up on small screens (on a C), and a whole octave up.
      index = 3 + CONSTANTS.NOTES_PER_OCTAVE;
      x = -this.config.whiteNoteWidth;
    }

    // Draw the black notes.
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE; i++) {
        if (blackNoteIndexes.indexOf(i) !== -1) {
          this.makeRect(index, x + this.config.whiteNoteWidth - halfABlackNote,
              y, this.config.blackNoteWidth,
              this.config.blackNoteHeight, 'black');
        } else {
          x += this.config.whiteNoteWidth;
        }
        index++;
      }
    }
  }

  /**
   *
   * @param {*} note
   * @param {*} button
   * @returns
   */
  highlightNote(note, button) {
    // Show the note on the piano roll.
    const rect = this.svg.querySelector(`rect[data-index="${note}"]`);
    if (!rect) {
      console.log('couldnt find a rect for note', note);
      return;
    }
    rect.setAttribute('active', true);
    rect.setAttribute('class', `color-${button}`);
    return rect;
  }

  /**
   *
   * @param {*} rect
   */
  clearNote(rect) {
    rect.removeAttribute('active');
    rect.removeAttribute('class');
  }

  /**
   *
   * @param {*} index
   * @param {*} x
   * @param {*} y
   * @param {*} w
   * @param {*} h
   * @param {*} fill
   * @param {*} stroke
   * @returns
   */
  makeRect(index, x, y, w, h, fill, stroke) {
    const rect = document.createElementNS(this.svgNS, 'rect');
    rect.setAttribute('data-index', index);
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', fill);
    if (stroke) {
      rect.setAttribute('stroke', stroke);
      rect.setAttribute('stroke-width', '3px');
    }
    this.svg.appendChild(rect);
    return rect;
  }
}
