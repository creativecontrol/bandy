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
 *  - Create a splashscreen
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

    this.playerCount = document.querySelector('#playerCount');
    this.liveState = document.querySelector('#liveState');

    this.drawInterval = 10;

    this.ON = 1;
    this.OFF = 0;

    this.ballColor = '#CA7C7C';
    this.ballX = canvas.width/2;
    this.ballY = canvas.height-30;
    this.ballRadius = 10;

    this.ballStopped = true;
    this.ballRefreshing = false;
    this.refreshTime = 700;

    this.ballSpeed = 3;
    this.numberOfPlayers;
    this.isLive;
    this.eventURL;
    this.projectWebsite;

    this.moveX = this.ballSpeed;
    // Start at a random angle
    this.moveY = -this.ballSpeed * Math.cos((Math.PI / 180) *
      ((90 * (Math.random())) - 45));

    this.paddleColor = '#EBEBEB';
    this.paddleWidth = 75;
    this.paddleHeight = 15;
    this.paddleBottomPadding = 55;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);
    this.rightPressed = false;
    this.leftPressed = false;
    this.paddleMove = 7;
    this.paddleRadius = this.paddleHeight*0.25;

    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;

    this.numberOfBlocks = 8;
    this.blockSize = this.canvas.width / 12;
    // this.blockSize = this.blockSize < 60 ? this.blockSize : 60;
    this.blockSpacing = this.blockSize/3;
    this.blockColors = [
      ['#EE2B29', '#f25a58'],
      ['#ff9800', '#ffad33'],
      ['#e6e600', '#ffff00'],
      ['#b2e600', '#c6ff00'],
      ['#00cee6', '#00e5ff'],
      ['#2979ff', '#5c99ff'],
      ['#651fff', '#8852ff'],
      ['#bf00e0', '#dd14ff'],
    ];

    this.blocksHit = new Array(this.numberOfBlocks).fill(0);

    this.blocksWidth = (this.numberOfBlocks * this.blockSize) +
      ((this.numberOfBlocks-1)*this.blockSpacing);
    this.blocksLeft = (this.canvas.width - this.blocksWidth) / 2;
    this.blocksY = 40;

    this.database = null;
    this.room = 'LiveRoom';
    this.playerId = null;
    this.playerRef;
    // Attach to firebase database
    firebase.auth().signInAnonymously()
        .then(() => {
          this.connectToDatabase();
          this.createNewPlayerEntry();
          this.run();
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(`${errorCode} ${errorMessage}`);
        });
    // Create a new user entry

    // Store that connection or user Id

    // On disconnect remove player entry in database
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
    this.eventURL = settings['eventURL'];
    this.projectWebsite = settings['projectWebsite'];

    this.playerCount.innerText = `Players: ${this.numberOfPlayers}`;

    if (this.isLive) {
      this.liveState.style.visibility = 'visible';
    } else {
      this.liveState.style.visibility = 'hidden';
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
      '0': this.OFF,
      '1': this.OFF,
      '2': this.OFF,
      '3': this.OFF,
      '4': this.OFF,
      '5': this.OFF,
      '6': this.OFF,
      '7': this.OFF,
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
    // window.onunload = window.onbeforeunload = () => {
    //   this.removePlayerEntry();
    // };
    // window.addEventListener('unload', this.removePlayerEntry.bind(this), false);

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
  draw() {
    // console.log('frame');
    this.clearCanvas();
    this.drawBall();
    this.drawPaddle();
    this.drawBlocks();
  }

  /**
   *
   */
  clearCanvas() {
    // this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = this.canvasColor;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   *
   */
  setCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight-this.headerSize;

    // if (devicePixelRatio >= 2) {
    //   this.canvas.width *= 2;
    //   this.canvas.height *= 2;
    // }
  }

  /**
   *
  */
  resizeCanvas() {
    this.ballStopped = true;

    this.setCanvasSize();

    // Recalc the elements
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);

    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;

    this.blockSize = this.canvas.width / 12;
    // this.blockSize = this.blockSize < 60 ? this.blockSize : 60;
    this.blockSpacing = this.blockSize/3;
    this.blocksWidth = (this.numberOfBlocks * this.blockSize) +
      ((this.numberOfBlocks-1)*this.blockSpacing);
    this.blocksLeft = (this.canvas.width - this.blocksWidth) / 2;


    this.clearCanvas();
  }

  /**
   *
   */
  drawBall() {
    if (!this.ballRefreshing) {
      this.ctx.beginPath();
      this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI*2);
      this.ctx.fillStyle = this.ballColor;
      this.ctx.fill();
      this.ctx.closePath();
    }

    if (this.ballStopped) {
      this.ballX = this.paddleCenter;
    } else {
      // console.log(`Ball X: ${this.ballX} Ball Y: ${this.ballY}`);
      this.checkBounds();
      this.checkBlockCollisions();

      this.ballX += this.moveX;
      this.ballY += this.moveY;
    }
  }

  /**
   *
   */
  checkBounds() {
    if (this.ballX + this.moveX > (this.canvas.width - this.ballRadius) ||
      this.ballX + this.moveX < this.ballRadius) {
      this.moveX = -this.moveX;
    }

    if (this.ballY + this.moveY < this.ballRadius) {
      this.moveY = -this.moveY;
    } else if (this.ballY + this.moveY >
        (this.paddleY - this.ballRadius) &&
        this.ballY + this.moveY <
          this.paddleY - this.ballRadius + this.paddleHeight &&
        this.ballX > this.paddleX &&
        this.ballX < this.paddleX + this.paddleWidth) {
      // this.moveY = -this.moveY;

      const angle = (Math.PI/180) * 120 *
        ((this.paddleCenter - this.ballX)/ this.paddleWidth);

      this.ballSpeed += 0.2;
      this.moveY = - this.ballSpeed * Math.cos(angle);
      this.moveX = - this.ballSpeed * Math.sin(angle);
    } else if (this.ballY + this.moveY >
      (this.canvas.height - this.ballRadius)) {
      // if at the bottom, reset
      this.ballX = this.paddleCenter;
      this.ballY = this.paddleY - this.ballRadius;
      this.ballStopped = true;
      this.ballRefreshing = true;
      this.moveX = this.ballSpeed;
      this.moveY = -this.ballSpeed;

      setTimeout(this.refreshBall.bind(this), this.refreshTime);
    }
  }

  /**
   *
   */
  refreshBall() {
    this.ballSpeed = 3;
    this.moveX = this.ballSpeed;
    // Start at a random angle
    this.moveY = -this.ballSpeed * Math.cos((Math.PI / 180) *
      ((90 * (Math.random())) - 45));
    this.ballRefreshing = false;
  }

  /**
   *
   */
  drawPaddle() {
    this.movePaddle();

    // this.ctx.beginPath();
    // this.ctx.rect(this.paddleX, this.paddleY,
    //     this.paddleWidth, this.paddleHeight);
    // this.ctx.fillStyle = this.paddleColor;
    // this.ctx.fill();
    // this.ctx.closePath();

    this.ctx.fillStyle = this.paddleColor;
    this.roundRect(this.ctx, this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight, this.paddleRadius, true, false);
  }

  /**
   * Draws a rounded rectangle using the current state of the canvas.
   * If you omit the last three params, it will draw a rectangle
   * outline with a 5 pixel border radius
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} x The top left x coordinate
   * @param {Number} y The top left y coordinate
   * @param {Number} width The width of the rectangle
   * @param {Number} height The height of the rectangle
   * @param {Number} [radius = 5] The corner radius; It can also be an object 
   *                 to specify different radii for corners
   * @param {Number} [radius.tl = 0] Top left
   * @param {Number} [radius.tr = 0] Top right
   * @param {Number} [radius.br = 0] Bottom right
   * @param {Number} [radius.bl = 0] Bottom left
   * @param {Boolean} [fill = false] Whether to fill the rectangle.
   * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
   */
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  /**
   *
   */
  movePaddle() {
    if (this.rightPressed) {
      this.paddleX += this.paddleMove;
      if (this.paddleX + this.paddleWidth > this.canvas.width) {
        this.paddleX = this.canvas.width - this.paddleWidth;
      }
    } else if (this.leftPressed) {
      this.paddleX -= 7;
      if (this.paddleX < 0) {
        this.paddleX = 0;
      }
    }

    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);
  }

  /**
   *
   */
  drawBlocks() {
    for (let i = 0; i < this.numberOfBlocks; i++) {
      this.ctx.beginPath();
      this.ctx.rect(this.blocksLeft + ((this.blockSize + this.blockSpacing)*i),
          this.blocksY, this.blockSize, this.blockSize);
      this.ctx.fillStyle = this.blockColors[i][this.blocksHit[i]];
      this.ctx.strokeStyle = this.blockColors[i][this.blocksHit[i]];
      this.ctx.lineWidth = 5;
      this.ctx.fill();
      if (this.blocksHit[i]) {
        this.ctx.stroke();
      }
      this.ctx.closePath();
    }
  }

  /**
   *
   */
  checkBlockCollisions() {
    // console.log('checking block collision');
    for (let i = 0; i < this.numberOfBlocks; i++) {
      const leftEdge = this.blocksLeft +
        ((this.blockSize + this.blockSpacing)*i);
      const rightEdge = leftEdge + this.blockSize;
      const topEdge = this.blocksY;
      const bottomEdge = topEdge + this.blockSize;

      // console.log(`l: ${leftEdge} r: ${rightEdge}`);

      if (this.ballX > leftEdge && this.ballX < rightEdge &&
        this.ballY > topEdge && this.ballY < bottomEdge ) {
        console.debug('collision');
        if (this.blocksHit[i] == 0) {
          this.moveY = -this.moveY;
          this.blockHit(i);
        }
      }
    }
  }

  /**
   *
   * @param {int} block
   */
  blockHit(block) {
    console.debug('You hit block ', block);
    this.flashBlock(block);
  }

  /**
   *
   * @param {int} block
   */
  flashBlock(block) {
    this.blocksHit[block] = 1;
    // Set the value in the database here
    let status = {};
    status[block.toString()] = this.ON;
    this.playerId.update(status);
    setTimeout(() => {
      this.blocksHit[block] = 0;
      // Set the value in the database here
      status = {};
      status[block.toString()] = this.OFF;
      this.playerId.update(status);
    }, 100);
  }

  /**
   *
   * @param {Event} e
   */
  keyDownHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
      this.rightPressed = true;
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
      this.leftPressed = true;
    } else if (e.key == ' ') {
      this.ballStopped = false;
    }
  }

  /**
   *
   * @param {Event} e
   */
  keyUpHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') {
      this.rightPressed = false;
    } else if (e.key == 'Left' || e.key == 'ArrowLeft') {
      this.leftPressed = false;
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchstartHandler(e) {
    console.debug(`touch start ${e}`);
    e.preventDefault();
    if (this.ballStopped) {
      this.ballStopped = false;
    }

    if (e.touches[0].clientX > this.paddleCenter) {
      this.rightPressed = true;
    } else if (e.touches[0].clientX < this.paddleCenter) {
      this.leftPressed = true;
    } else {
      this.rightPressed = false;
      this.leftPressed = false;
    }
  }

  /**
   *
   * @param {Event} e
   */
  touchendHandler(e) {
    console.debug('touch end');
    this.rightPressed = false;
    this.leftPressed = false;
  }

  /**
   *
   * @param {Event} e
   */
  touchmoveHandler(e) {
    console.debug(`touch move ${e.touches[0]}`);
    e.preventDefault();
    // if (e.touches[0].clientX > this.paddleCenter) {
    //   this.rightPressed = true;
    // } else if (e.touches[0].clientX < this.paddleCenter) {
    //   this.leftPressed = true;
    // } else {
    //   this.rightPressed = false;
    //   this.leftPressed = false;
    // }
  }

  /**
   *
   * @param {Event} e
   */
  touchcancelHandler(e) {
    console.debug('touch cancel');
    this.rightPressed = false;
    this.leftPressed = false;
  }
} // End of BandyClient Class

window.onload = () => {
  window.app = new BandyClient();
};
