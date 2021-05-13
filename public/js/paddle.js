/**
 * Paddle Game
 */
class Paddle {
  /**
   *
   * @param {*} _canvas
   * @param {*} _context
   */
  constructor(_canvas, _context, _parent) {
    this.canvas = _canvas;
    this.context = _context;
    this.parent = _parent;

    this.instructionTime = 14000;
    this.instructionText = `
    <div>
      <h3> Paddle Game Instructions </h3>
      Use the Info Button above for Help <br>
      </br>
      <strong>Touch Controls:</strong> </br>
      Tap to start the ball. </br>
      Press to the left or right side of the white platform to move it in that direction. </br>
      </br>
      <strong>Keyboard Controls:</strong> </br>
      Press the spacebar to start the ball. </br>
      Use the Arrow Keys to move the white platform left or right. </br>
    </div>`;

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
    this.eventInfoSetting;
    this.projectWebsite;

    this.moveX = this.ballSpeed;
    // Start at a random angle
    this.moveY = -this.ballSpeed * Math.cos((Math.PI / 180) *
      ((90 * (Math.random())) - 45));

    this.paddleColor = '#EBEBEB';
    this.paddleWidth = 60;
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
    this.blockStatusResetTime = 150;

    this.blocksWidth = (this.numberOfBlocks * this.blockSize) +
      ((this.numberOfBlocks-1)*this.blockSpacing);
    this.blocksLeft = (this.canvas.width - this.blocksWidth) / 2;
    this.blocksY = 40;

    this.hitCounter = 0;
    this.hitMax = 100;
  }

  /**
   *
   */
  setInstructions() {
    this.parent.instructions.innerHTML = this.instructionText;
  }

  /**
   *
   */
  drawInstructions() {
    // Show instructions text and then fade it out.
    this.parent.instructions.className = 'fadeIn';
    setTimeout(() => {
      this.parent.instructions.className = 'fadeOut';
      // this.parent.instructions.innerHTML = '';
    }, this.instructionTime);
  }

  /**
   *
   */
  update() {
    this.drawBall();
    this.drawPaddle();
    this.drawBlocks();
  }

  /**
   * Deal with the resizing of the window
   */
  resize() {
    this.ballStopped = true;

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
      this.context.beginPath();
      this.context.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI*2);
      this.context.fillStyle = this.ballColor;
      this.context.fill();
      this.context.closePath();
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
  };

  /**
   *
   */
  refreshBall() {
    this.ballSpeed = 3;
    // Start at a random angle
    this.move.x = this.ballSpeed * this.randomAngle();
    this.move.y = -this.ballSpeed;

    this.hitCounter = 0;
    this.ballRefreshing = false;
  }

  /**
   *
   * @return {*}
   */
  randomAngle() {
    return (Math.PI / 180) * ((90 * (Math.random())) - 45);
  }

  /**
   *
   */
  drawPaddle() {
    this.movePaddle();

    this.context.fillStyle = this.paddleColor;
    roundRect(this.context, this.paddleX, this.paddleY,
        this.paddleWidth, this.paddleHeight, this.paddleRadius, true, false);
  };

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
      this.context.beginPath();
      this.context.rect(
          this.blocksLeft +
          ((this.blockSize + this.blockSpacing)*i),
          this.blocksY, this.blockSize, this.blockSize,
      );
      this.context.fillStyle = this.blockColors[i][this.blocksHit[i]];
      this.context.strokeStyle = this.blockColors[i][this.blocksHit[i]];
      this.context.lineWidth = 5;
      this.context.fill();
      if (this.blocksHit[i]) {
        this.context.stroke();
      }
      this.context.closePath();
    }
  };

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
  };

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
  };

  /**
 *
 * @param {int} block
 */
  blockHit(block) {
    console.debug('You hit block ', block);
    this.flashBlock(block);
    this.hitLimiter();
  }

  /**
   *
   */
  hitLimiter() {
    this.hitCounter += 1;

    if (this.hitCounter > this.hitMax) {
      this.ball.x = this.paddleCenter;
      this.ball.y = this.paddleY - this.ballRadius;
      this.ballStopped = true;
      this.ballRefreshing = true;
      this.move.x = this.ballSpeed;
      this.move.y = -this.ballSpeed;

      setTimeout(this.refreshBall.bind(this), this.refreshTime);
    }
  }

  /**
   *
   * @param {int} block
   */
  flashBlock(block) {
    this.blocksHit[block] = 1;
    // Set the value in the database here
    let status = {};
    status[block.toString()] = ON;
    this.parent.playerId.update(status);
    setTimeout(() => {
      this.blocksHit[block] = 0;
      // Set the value in the database here
      status = {};
      status[block.toString()] = OFF;
      this.parent.playerId.update(status);
    }, this.blockStatusResetTime);
  }
} // End of Paddle Class
