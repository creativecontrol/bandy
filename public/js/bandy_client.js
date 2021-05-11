/**
 * Database format
 * players: {
 *  <playerid>: {
 *    0: 1,
 *    1: 0,
 *    2: 0,
 *    3: 0,
 *    4: 0,
 *    5: 0,
 *    6: 0,
 *    7: 0,
 * }
 * }
 *
 * TODO:
 *  - Make any links open in new window.
 *  - Update CSS formatting of radios to buttons
 *
 */

const ON = 1;
const OFF = 0;

/**
 *
 */
class BandyClient {
  /**
    *
    */
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasColor = '#333333';
    this.headerSize = 60;
    this.setCanvasSize();

    this.instructionTime = 10000;

    this.playerCount = document.querySelector('#playerCount');
    this.infoAction = document.querySelector('#info');
    this.infoBox = document.querySelector('#infoBox');
    this.noEventInfo = document.querySelector('#noEventInfo');
    this.eventInfo = document.querySelector('#eventInfo');
    this.eventURL = document.querySelector('#eventURL');
    this.projectWebsite = document.querySelectorAll('#projectWebsite');
    this.helpURL = document.querySelector('#helpURL');

    this.splash = document.querySelector('.splash');
    this.gameChoice = document.querySelector('.gameChoice');
    this.game = document.querySelector('.loaded');
    this.instructions = document.querySelector('#instructions');
    this.showInstructionsAction = document.querySelector('#showInstructions');

    this.joinButtonAction = document.querySelector('#joinButton');
    this.splashNoEvent = document.querySelector('.splash-noevent');
    this.splashLive = document.querySelector('.splash-live');

    this.gameSelectAction =
        document.querySelectorAll('input[name="gameSelect"]');
    this.tombolaButtonAction = document.querySelector('#tombolaButton');
    this.tombolaRadioAction = document.querySelector('#tombolaRadio');
    this.paddleButtonAction = document.querySelector('#paddleButton');
    this.paddleRadioAction = document.querySelector('#paddleRadio');

    this.paddleGame = new Paddle(this.canvas, this.ctx, this);
    this.tombolaGame = new Tombola(this.canvas, this.ctx, this);

    this.firstPlay = {
      paddle: true,
      tombola: true,
    };

    this.currentGame = '';

    this.drawInterval = 10;

    this.database = null;
    this.room = 'LiveRoom';
    this.playerId = null;
    this.playerRef;

    // Attach to firebase database
    firebase.auth().signInAnonymously()
        .then(() => {
          this.connectToDatabase();
          this.run();
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
  connectToDatabase() {
    this.database = firebase.database();

    const settings = firebase.database().ref(`${this.room}/settings/`);
    settings.on('value', (snapshot) => {
      this.applySettingsFromDatabase(snapshot.val());
    });
  }

  /**
   *
   * @param {*} settings
   */
  applySettingsFromDatabase(settings) {
    console.log(`applying Settings`);
    this.ballSpeed = settings['ballStartSpeed'];
    this.numberOfPlayers = settings['numberOfPlayers'];
    this.isLive = settings['isLive'];
    this.noEventInfoSetting = settings['noEventInfo'];
    this.eventInfoSetting = settings['eventInfo'];
    this.eventURLSetting = settings['eventURL'];
    this.projectWebsiteSetting = settings['projectWebsite'];
    this.helpURLSetting = settings['helpURL'];

    this.playerCount.innerText = `Players: ${this.numberOfPlayers}`;
    this.noEventInfo.innerHTML = this.noEventInfoSetting;
    this.eventInfo.innerHTML = this.eventInfoSetting;

    this.eventURL.innerHTML =
        `<a href="${this.eventURLSetting}">` +
        `${this.eventURLSetting}</a>`;
    this.projectWebsite.forEach((element) => {
      element.innerHTML =
        `<a href="${this.projectWebsiteSetting}">` +
        `${this.projectWebsiteSetting}</a>`;
    });
    this.helpURL.innerHTML =
        `<a href="${this.helpURLSetting}">` +
        `${this.helpURLSetting}</a>`;

    if (this.isLive) {
      this.splashNoEvent.hidden = true;
      this.splashLive.hidden = false;
    } else {
      this.splashNoEvent.hidden = false;
      this.splashLive.hidden = true;
    }
  }

  /**
   *
   */
  createNewPlayerEntry() {
    const playersRef = this.database.ref(`${this.room}/players/`);
    this.playerId = playersRef.push();
    console.log(`Player ID: ${this.playerId}`);
    this.playerId.set({
      '0': OFF,
      '1': OFF,
      '2': OFF,
      '3': OFF,
      '4': OFF,
      '5': OFF,
      '6': OFF,
      '7': OFF,
    });

    this.playerId.onDisconnect().remove();
  }

  /**
   *
   */
  removePlayerEntry() {
    this.playerId.set(null);
  }

  /**
   *
   */
  run() {
    console.log('starting run');
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    this.joinButtonAction.onclick = () => {
      this.createNewPlayerEntry();
      this.splash.hidden = true;
      this.gameChoice.hidden = false;
      this.game.hidden = true;
    };

    // Game selection from the intro screen
    this.tombolaButtonAction.onclick = () => {
      this.currentGame = 'tombola';
      this.tombolaRadioAction.checked = true;
      this.firstPlay.tombola = false;
      this.addInitialStat();

      this.splash.hidden = true;
      this.gameChoice.hidden = true;
      this.game.hidden = false;
      this.tombolaGame.setInstructions();
      this.tombolaGame.drawInstructions();
    };
    this.paddleButtonAction.onclick = () => {
      this.currentGame = 'paddle';
      this.firstPlay.paddle = false;
      this.addInitialStat();

      this.paddleRadioAction.checked = true;
      this.splash.hidden = true;
      this.gameChoice.hidden = true;
      this.game.hidden = false;
      this.paddleGame.setInstructions();
      this.paddleGame.drawInstructions();
    };

    // Game selection from the Info box
    this.gameSelectAction.forEach((gameSelect) => {
      gameSelect.onchange = (game) => {
        this.currentGame = game.srcElement.value;
        this.addChangeStat();

        if (this.currentGame == 'paddle') {
          this.paddleGame.setInstructions();
          if (this.firstPlay.paddle) {
            this.paddleGame.drawInstructions();
            this.firstPlay.paddle = false;
          }
        } else if (this.currentGame == 'tombola') {
          this.tombolaGame.setInstructions();
          if (this.firstPlay.tombola) {
            this.tombolaGame.drawInstructions();
            this.firstPlay.tombola = false;
          }
        }

        this.toggleInfoBox();
      };
    });

    this.infoAction.onclick = () => {
      this.toggleInfoBox();
    };

    this.showInstructionsAction.onclick = () => {
      this.toggleInfoBox();
      this.drawInstructions();
    };

    document.addEventListener('keydown', this.keyDownHandler.bind(this), false);
    document.addEventListener('keyup', this.keyUpHandler.bind(this), false);

    this.canvas.addEventListener('touchstart',
        this.touchstartHandler.bind(this), false);
    this.canvas.addEventListener('touchmove',
        this.touchmoveHandler.bind(this), false);
    this.canvas.addEventListener('touchcancel',
        this.touchcancelHandler.bind(this), false);
    this.canvas.addEventListener('touchend',
        this.touchendHandler.bind(this), false);

    this.interval = setInterval(this.draw.bind(this), this.drawInterval);
  }

  /**
   *
   */
  toggleInfoBox() {
    this.infoBox.hidden = !this.infoBox.hidden;
  }

  /**
   *
   */
  addInitialStat() {
    const statPath = `${this.room}/stats/initialGame/${this.currentGame}`;
    this.database.ref(statPath)
        .set(firebase.database.ServerValue.increment(1));
  }

  /**
   *
   */
  addChangeStat() {
    const statPath = `${this.room}/stats/changeTo/${this.currentGame}`;
    this.database.ref(statPath)
        .set(firebase.database.ServerValue.increment(1));
  }

  /**
   *
   */
  changeGame() {
    // clear the board
    this.clearCanvas();
    // refresh the ball
    setTimeout(this.refreshBall.bind(this), this.refreshTime);
  }

  /**
   *
   */
  draw() {
    // console.log('frame');
    this.clearCanvas();
    if (this.currentGame == 'paddle') {
      this.paddleGame.update();
    } else if (this.currentGame == 'tombola') {
      this.tombolaGame.update();
    }
  }

  /**
   *
   */
  drawInstructions() {
    // Show instructions text and then fade it out.
    this.instructions.className = 'fadeIn';
    setTimeout(() => {
      this.instructions.className = 'fadeOut';
    }, this.instructionTime);
  }

  /**
   *
   */
  clearCanvas() {
    this.ctx.fillStyle = this.canvasColor;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   *
   */
  setCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight-this.headerSize;
  }

  /**
   *
   */
  resizeCanvas() {
    this.setCanvasSize();

    if (this.currentGame == 'paddle') {
      this.paddleGame.resize();
    } else if (this.currentGame == 'tombola') {
      this.tombolaGame.resize();
    }

    this.clearCanvas();
  }

  // --------------------------------------------------------
  // User interaction Event Handlers
  // --------------------------------------------------------
  /**
   *
   * @param {Event} e
   */
  keyDownHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
      if (this.currentGame == 'paddle') {
        this.paddleGame.rightPressed = true;
      }
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
      if (this.currentGame == 'paddle') {
        this.paddleGame.leftPressed = true;
      }
    } else if (e.key == ' ') {
      if (this.currentGame == 'paddle') {
        this.paddleGame.ballStopped = false;
      } else if (this.currentGame == 'tombola') {
        this.tombolaGame.ballStopped = false;
      }
    }
  }

  /**
   *
   * @param {Event} e
   */
  keyUpHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
      if (this.currentGame == 'paddle') {
        this.paddleGame.rightPressed = false;
      }
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
      if (this.currentGame == 'paddle') {
        this.paddleGame.leftPressed = false;
      }
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchstartHandler(e) {
    console.debug(`touch start ${e}`);
    e.preventDefault();
    if (this.currentGame == 'paddle') {
      if (this.paddleGame.ballStopped) {
        this.paddleGame.ballStopped = false;
      }

      if (e.touches[0].clientX > this.paddleGame.paddleCenter) {
        this.paddleGame.rightPressed = true;
      } else if (e.touches[0].clientX < this.paddleGame.paddleCenter) {
        this.paddleGame.leftPressed = true;
      } else {
        this.paddleGame.rightPressed = false;
        this.paddleGame.leftPressed = false;
      }
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchendHandler(e) {
    console.debug('touch end');
    if (this.currentGame == 'paddle') {
      this.paddleGame.rightPressed = false;
      this.paddleGame.leftPressed = false;
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchmoveHandler(e) {
    console.debug(`touch move ${e.touches[0]}`);
    e.preventDefault();

    if (this.currentGame == 'paddle') {
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchcancelHandler(e) {
    console.debug('touch cancel');
    if (this.currentGame == 'paddle') {
      this.paddleGame.rightPressed = false;
      this.paddleGame.leftPressed = false;
    }
  }
} // End of BandyClient Class

window.onload = () => {
  window.app = new BandyClient();
};
