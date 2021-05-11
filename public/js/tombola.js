/**
 *
 */
class Tombola {
  /**
   *
   * @param {*} _canvas
   * @param {*} _context
   * @param {*} _parent
   */
  constructor(_canvas, _context, _parent) {
    this.canvas = _canvas;
    this.context = _context;
    this.parent = _parent;

    this.instructionTime = 14000;
    this.instructionText = `
      <h3> Tombola Game Instructions </h3>
      Use the Info Button above for Help <br>
      </br>
      Tap the screen or press the spacebar to start the ball. </br>
      When it stops start it again!
      `;

    this.paddleColor = '#EBEBEB';
    this.paddleWidthScreenPortion = 0.2;
    this.paddleWidth = this.canvas.width*this.paddleWidthScreenPortion;
    this.paddleHeight = 15;
    this.paddleBottomPadding = 0;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);

    this.ballColor = '#CA7C7C';
    this.ballX = canvas.width/2;
    this.ballY = canvas.height-30;
    this.ballRadius = 10;

    this.ballStopped = true;
    this.ballRefreshing = false;
    this.refreshTime = 700;

    this.ballSpeed = 3;
    this.ball = {
      x: this.paddleCenter,
      y: this.paddleY - this.ballRadius,
    };

    this.move = {
      x: this.ballSpeed,
      // Start at a random angle
      y: -this.ballSpeed * Math.cos((Math.PI / 180) *
        ((90 * (Math.random())) - 45)),
    };

    this.tombolaSize = 105;
    this.tombolaRotation = Date.now()/50 % 360;

    this.numberOfPanels = 8;
    this.panelRotations = [90, -45, 0, 45, 90, -45, 0, 45];
    this.panelColors = [
      ['#EE2B29', '#f25a58'],
      ['#ff9800', '#ffad33'],
      ['#e6e600', '#ffff00'],
      ['#b2e600', '#c6ff00'],
      ['#00cee6', '#00e5ff'],
      ['#2979ff', '#5c99ff'],
      ['#651fff', '#8852ff'],
      ['#bf00e0', '#dd14ff'],
    ];

    this.panelsHit = new Array(this.numberOfPanels).fill(0);
    this.panelStatusResetTime = 150;

    this.panelSize = {
      w: 35,
      h: 15,
    };

    this.panelPositions = [
      {radius: this.tombolaSize, theta: 0},
      {radius: this.tombolaSize, theta: 45},
      {radius: this.tombolaSize, theta: 90},
      {radius: this.tombolaSize, theta: 135},
      {radius: this.tombolaSize, theta: 180},
      {radius: this.tombolaSize, theta: 225},
      {radius: this.tombolaSize, theta: 270},
      {radius: this.tombolaSize, theta: 315},
    ];

    this.panelGroupCenter = {
      x: this.canvas.width/2 - 30,
      y: this.canvas.height * 0.37,
    };

    this.leftGuide;
    this.rightGuide;
  };

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
    }, this.instructionTime);
  }

  /**
   *
   */
  update() {
    this.drawPaddle();
    this.drawGuides();
    this.drawTombola();
    this.drawBall();
  }

  /**
   * Deal with the resizing of the window
   */
  resize() {
    // Tombola position
    this.panelGroupCenter = {
      x: this.canvas.width/2,
      y: this.canvas.height/4,
    };

    // Paddle position/size
    this.paddleWidth = this.canvas.width*this.paddleWidthScreenPortion;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);

    // Ball positon
    this.ball.x = this.paddleCenter;
    this.ball.y = this.paddleY - this.ballRadius;
  }
  /**
   *
   */
  drawBall() {
    if (!this.ballRefreshing) {
      this.context.beginPath();
      this.context.arc(this.ball.x, this.ball.y, this.ballRadius, 0, Math.PI*2);
      this.context.fillStyle = this.ballColor;
      this.context.fill();
      this.context.closePath();
    }

    if (this.ballStopped) {
      this.ball.x = this.paddleCenter;
    } else {
      // console.log(`Ball X: ${this.ballX} Ball Y: ${this.ballY}`);
      this.checkBounds();
      this.checkPanelCollisions();

      this.ball.x += this.move.x;
      this.ball.y += this.move.y;
    }
  };

  /**
   *
   */
  refreshBall() {
    this.ballSpeed = 3;
    this.move.x = this.ballSpeed;
    // Start at a random angle
    this.move.y = -this.ballSpeed * this.randomAngle();

    // console.log(this.move.y);
    this.ballRefreshing = false;
  }

  /**
   *
   * @return {*}
   */
  randomAngle() {
    return Math.cos((Math.PI / 180) * ((90 * (Math.random())) - 45));
  }

  /**
   *
   */
  drawPaddle() {
    // this.movePaddle();

    this.context.fillStyle = this.paddleColor;
    roundRect(this.context, this.paddleX, this.paddleY,
        this.paddleWidth, this.paddleHeight, this.paddleRadius, true, false);
  };

  /**
   *
   */
  drawGuides() {

  };

  /**
   *
   */
  drawTombola() {
    this.tombolaRotation = Date.now()/50 % 360;

    this.panelPositions.forEach((position, index) => {
      const panelPosition = polToCar(
          position.radius,
          position.theta + this.tombolaRotation,
      );
      const panelCenter = {
        x: panelPosition.x + (0.5 * this.panelSize.w) + this.panelGroupCenter.x,
        y: panelPosition.y + (0.5 * this.panelSize.h) + this.panelGroupCenter.y,
      };

      // draw the panel
      this.context.beginPath();
      this.context.save();
      this.context.translate(panelCenter.x, panelCenter.y);
      this.context.rotate(degToRad(this.panelRotations[index] + this.tombolaRotation));
      this.context.translate(-panelCenter.x, -panelCenter.y);
      this.context.fillStyle = this.panelColors[index][this.panelsHit[index]];
      this.context.fillRect(panelCenter.x - this.panelSize.w/2,
          panelCenter.y - this.panelSize.h/2,
          this.panelSize.w, this.panelSize.h);
      if (this.panelsHit[index]) {
        this.context.strokeStyle = this.panelColors[index][this.panelsHit[index]];
        this.context.lineWidth = 5;
        this.context.strokeRect(panelCenter.x - this.panelSize.w/2,
            panelCenter.y - this.panelSize.h/2,
            this.panelSize.w, this.panelSize.h);
      }
      
      this.context.closePath();
      this.context.restore();
    });
  };

  /**
 *
 */
  checkBounds() {
    // Check collision with Guides and Paddle

    if (this.ball.x + this.move.x > (this.canvas.width - this.ballRadius) ||
      this.ball.x + this.move.x < this.ballRadius) {
      this.move.x = -this.move.x;
    }

    if (this.ball.y + this.move.y < this.ballRadius) {
      this.move.y = -this.move.y;
    } else if (this.ball.y + this.move.y >
        (this.paddleY - this.ballRadius) &&
        this.ball.y + this.move.y <
          this.paddleY - this.ballRadius + this.paddleHeight &&
        this.ball.x > this.paddleX &&
        this.ball.x < this.paddleX + this.paddleWidth) {
      // this.moveY = -this.moveY;

      const angle = (Math.PI/180) * 120 *
        ((this.paddleCenter - this.ball.x)/ this.paddleWidth);

      this.ballSpeed += 0.2;
      this.move.y = -this.ballSpeed * Math.cos(angle);
      this.move.x = -this.ballSpeed * Math.sin(angle);
    } else if (this.ball.y + this.move.y >
      (this.canvas.height - this.ballRadius)) {
      // if at the bottom, reset
      this.ball.x = this.paddleCenter;
      this.ball.y = this.paddleY - this.ballRadius;
      this.ballStopped = true;
      this.ballRefreshing = true;
      this.move.x = this.ballSpeed;
      this.move.y = -this.ballSpeed;

      setTimeout(this.refreshBall.bind(this), this.refreshTime);
    }
  };

  /**
   * Based on circle rotated rect collision
   * http://www.migapro.com/circle-and-rotated-rectangle-collision-detection/
   */
  checkPanelCollisions() {
    this.panelRotations.forEach((panelRotation, index) => {
      const panelPosition = polToCar(
          this.panelPositions[index].radius,
          this.panelPositions[index].theta + this.tombolaRotation,
      );

      const panelCenter = {
        x: panelPosition.x + (0.5 * this.panelSize.w) + this.panelGroupCenter.x,
        y: panelPosition.y + (0.5 * this.panelSize.h) + this.panelGroupCenter.y,
      };

      const panelAngle = degToRad(panelRotation + this.tombolaRotation);

      const unrotatedBallX = Math.cos(panelAngle) *
        (this.ball.x - panelCenter.x) -
        Math.sin(panelAngle) * (this.ball.y - panelCenter.y) +
        panelCenter.x;
      const unrotatedBallY = Math.sin(panelAngle) *
        (this.ball.x - panelCenter.x) +
        Math.cos(panelAngle) * (this.ball.y - panelCenter.y) +
        panelCenter.y;

      // DEBUGGING Hit Geometry
      // this.context.beginPath();
      // this.context.arc(unrotatedBallX, unrotatedBallY, 4, 0, Math.PI*2);
      // this.context.fillStyle = '#DDF';
      // this.context.fill();
      // this.context.closePath();

      // this.context.beginPath();
      // this.context.arc(panelCenter.x, panelCenter.y, 4, 0, Math.PI*2);
      // this.context.strokeStyle = '#FFF';
      // this.context.stroke();
      // this.context.closePath();

      // Closest point in the rectangle to the center of circle rotated backwards(unrotated)
      const closest = {
        x: 0,
        y: 0,
      };

      // Should the panelSizes be divided by two?

      // Find the unrotated closest x point from center of unrotated circle
      if (unrotatedBallX < panelCenter.x - this.panelSize.w/2) {
        closest.x = panelCenter.x - this.panelSize.w/2;
      } else if (unrotatedBallX > panelCenter.x + this.panelSize.w/2) {
        closest.x = panelCenter.x + this.panelSize.w/2;
      } else {
        closest.x = unrotatedBallX;
      }

      // Find the unrotated closest y point from center of unrotated circle
      if (unrotatedBallY < panelCenter.y - this.panelSize.h/2) {
        closest.y = panelCenter.y - this.panelSize.h/2;
      } else if (unrotatedBallY > panelCenter.y + this.panelSize.h/2) {
        closest.y = panelCenter.y + this.panelSize.h/2;
      } else {
        closest.y = unrotatedBallY;
      }

      // Determine collision
      const distance = findDistance(unrotatedBallX, unrotatedBallY,
          closest.x, closest.y);
      if (distance < this.ballRadius) {
        if (this.panelsHit[index] == 0) {
          this.move.y = -this.move.y;
          this.move.x = -this.move.x * this.randomAngle();
          // console.log(`Move x after hit: ${this.move.x}`);
          this.panelHit(index);
        }
      }
    });
  }

  // checkPanelCollisions() {
  //   // console.log('checking block collision');
  //   for (let i = 0; i < this.numberOfPanels; i++) {
  //     const leftEdge = this.blocksLeft +
  //       ((this.blockSize + this.blockSpacing)*i);
  //     const rightEdge = leftEdge + this.blockSize;
  //     const topEdge = this.blocksY;
  //     const bottomEdge = topEdge + this.blockSize;

  //     // console.log(`l: ${leftEdge} r: ${rightEdge}`);

  //     if (this.ballX > leftEdge && this.ballX < rightEdge &&
  //       this.ballY > topEdge && this.ballY < bottomEdge ) {
  //       console.debug('collision');
  //       if (this.blocksHit[i] == 0) {
  //         this.moveY = -this.moveY;
  //         this.blockHit(i);
  //       }
  //     }
  //   }

  // };

   /**
 *
 * @param {int} block
 */
  panelHit(panel) {
    console.debug('You hit panel ', panel);
    this.flashPanel(panel);
  }

  /**
   *
   * @param {int} block
   */
  flashPanel(panel) {
    this.panelsHit[panel] = 1;
    // Set the value in the database here
    let status = {};
    status[panel.toString()] = ON;
    this.parent.playerId.update(status);
    setTimeout(() => {
      this.panelsHit[panel] = 0;
      // Set the value in the database here
      status = {};
      status[panel.toString()] = OFF;
      this.parent.playerId.update(status);
    }, this.panelStatusResetTime);
  }
} // End of Tombola Class
