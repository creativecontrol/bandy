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
 *  - Add touch controls; touch once for first fire, scroll for paddle
 */
class PongsembleClient {
  /**
    *
    */
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvasColor = '#333333';

    this.drawInterval = 10;

    this.ballColor = '#0095DD';
    this.ballX = canvas.width/2;
    this.ballY = canvas.height-30;
    this.ballRadius = 10;

    this.ballStopped = true;
    this.ballRefreshing = false;
    this.refreshTime = 700;

    this.ballSpeed = 3;

    this.moveX = this.ballSpeed;
    // Start at a random angle
    this.moveY = -this.ballSpeed * Math.cos((Math.PI / 180) *
      ((90 * (Math.random())) - 45));

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

    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;

    this.numberOfBlocks = 8;
    this.blockSize = this.canvas.width / 8;
    // this.blockSize = this.blockSize < 60 ? this.blockSize : 60;
    this.blockSpacing = 0;
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

    // Attach to firebase database

    // Create a new user entry

    // Store that connection or user Id

    // On disconnect remove player entry in database

    window.addEventListener('resize', this.resizeCanvas.bind(this));
    document.addEventListener('keydown', this.keyDownHandler.bind(this), false);
    document.addEventListener('keyup', this.keyUpHandler.bind(this), false);
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
  resizeCanvas() {
    this.ballStopped = true;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Recalc the elements
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);

    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;

    this.blockSize = this.canvas.width / 8;
    // this.blockSize = this.blockSize < 60 ? this.blockSize : 60;
    this.blockSpacing = 0;
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
        (this.canvas.height - this.ballRadius -
          (this.paddleHeight + this.paddleBottomPadding)) &&
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

    this.ctx.beginPath();
    this.ctx.rect(this.paddleX, this.paddleY,
        this.paddleWidth, this.paddleHeight);
    this.ctx.fillStyle = '#0095DD';
    this.ctx.fill();
    this.ctx.closePath();
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
        console.log('collision');
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
    console.log('You hit block ', block);
    this.flashBlock(block);
  }

  /**
   *
   * @param {int} block
   */
  flashBlock(block) {
    this.blocksHit[block] = 1;
    // Set the value in the database here
    setTimeout(() => {
      this.blocksHit[block] = 0;
      // Set the value in the database here
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
} // End of PonsembleClient Class

window.onload = () => {
  window.app = new PongsembleClient();
};
