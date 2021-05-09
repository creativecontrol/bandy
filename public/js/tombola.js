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

    this.paddleColor = '#EBEBEB';
    this.paddleWidth = this.canvas.width/10;
    this.paddleHeight = 15;
    this.paddleBottomPadding = 55;
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
    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;

    this.moveX = this.ballSpeed;
    // Start at a random angle
    this.moveY = -this.ballSpeed * Math.cos((Math.PI / 180) *
      ((90 * (Math.random())) - 45));

    this.tombolaSize = 125;

    this.panelRotations = [90, -45, 0, 45, 90, -45, 0, 45];
    this.panelColors = [
      '#EE2B29',
      '#ff9800',
      '#ffff00',
      '#c6ff00',
      '#00e5ff',
      '#2979ff',
      '#651fff',
      '#d500f9',
    ];

    this.panelSize = {
      w: 50,
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
      x: this.canvas.width/2,
      y: this.canvas.height/4,
    };

    this.leftGuide;
    this.rightGuide;
  };

  /**
   *
   */
  init() {

  }

  /**
   *
   */
  update() {
    this.drawBall();
    this.drawPaddle();
    // this.drawGuides();
    this.drawTombola();
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
    this.paddleWidth = this.canvas.width/10;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleY = this.canvas.height -
      (this.paddleHeight + this.paddleBottomPadding);
    this.paddleCenter = this.paddleX + (this.paddleWidth / 2);

    // Ball positon
    this.ballX = this.paddleCenter;
    this.ballY = this.paddleY - this.ballRadius;
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
    const groupRotation = Date.now()/50 % 360;

    this.context.save();

    this.context.beginPath();
    // this.context.arc(this.groupCenter.x, this.groupCenter.y, 5, 0, 2 * Math.PI);
    // this.context.strokeStyle = '#FFF';
    // this.context.stroke();

    this.context.translate(this.panelGroupCenter.x, this.panelGroupCenter.y);
    this.context.rotate(degToRad(groupRotation));

    this.panelPositions.forEach((position, index) => {
      this.drawPanel(position, this.panelSize, this.panelRotations[index], this.panelColors[index]);
    });

    this.context.restore();
  };

  /**
   *
   * @param {*} _position
   * @param {*} _panelSize
   * @param {*} _rotation
   * @param {*} _color
   */
  drawPanel(_position, _panelSize, _rotation, _color) {
    const cartesian = polToCar(_position.radius, _position.theta);
    const centerX = cartesian.x + (0.5 * _panelSize.w);
    const centerY = cartesian.y + (0.5 * _panelSize.h);

    // draw the panel
    this.context.save();
    this.context.translate(centerX, centerY);
    this.context.rotate(degToRad(_rotation));
    this.context.translate(-centerX, -centerY);
    this.context.fillStyle = _color;
    this.context.fillRect(cartesian.x, cartesian.y, _panelSize.w, _panelSize.h);
    this.context.restore();
  }

  /**
 *
 */
  checkBounds() {
    // Check collision with Guides and Paddle
  };

  /**
   *
   */
  checkPanelCollisions() {

  };

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
    }, 100);
  }
} // End of Tombola Class
