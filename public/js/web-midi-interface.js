/**
 * Web MIDI Interface simplifies the use of WebMIDI.js for backend and
 *  frontend use in musical JavaScipt web applications
 */
class WebMIDIInterface { // eslint-disable-line no-unused-vars
  /**
   *
   * @param {HTMLSelectElement} _inputSelector Dropdown Select for MIDI input interface.
   * @param {HTMLSelectElement} _outputSelector Dropdown Select for MIDI output interface.
   */
  constructor({_inputSelector = null, _outputSelector=null}={}) {
    this.midiInputSelector = _inputSelector;
    this.midiOutputSelector = _outputSelector;
    this.currentMidiInput;
    this.currentMidiOutput;
    this.enabled = false;
  }

  /**
   *
   */
  init() {
    WebMidi.enable((err) => {
      if (err) {
        console.warn('WebMidi could not be enabled.', err);
        return;
      } else {
        this.enabled = true;
        console.info('WebMidi enabled!');
        console.log(`input ${this.midiInputSelector}`);
        console.log(`output ${this.midiOutputSelector}`);
        if (this.midiInputSelector != null) {
          this.buildInputSelector();
          this.onMidiInputChange();
        }
        if (this.midiOutputSelector != null) {
          this.buildOutputSelector();
          this.onMidiOutputChange();
        }
      }
    });
  }

  /**
   * Create a set of Select Options based on available WebMidi.inputs
   * and append them to the defined HTMLSelectElement.
   */
  buildInputSelector() {
    for (const input of WebMidi.inputs) {
      const inputOption = document.createElement('option');
      inputOption.value = input.id;
      inputOption.textContent = input.name;
      this.midiInputSelector.appendChild(inputOption);
    }
  }

  /**
   *
   */
  onMidiInputChange() {
    const inputId = this.midiInputSelector.value;
    if (inputId === 'internal') {
      this.currentMidiInput = null;
    } else {
      this.currentMidiInput = WebMidi.getinputById(inputId);
    }
  }

  /**
   * Create a set of Select Options based on available WebMidi.outputs
   * and append them to the defined HTMLSelectElement.
   */
  buildOutputSelector() {
    for (const output of WebMidi.outputs) {
      const outputOption = document.createElement('option');
      outputOption.value = output.id;
      outputOption.textContent = output.name;
      this.midiOutputSelector.appendChild(outputOption);
    }
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
}
