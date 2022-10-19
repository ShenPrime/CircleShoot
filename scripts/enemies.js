class Enemy {

  constructor(x, y, radius, color, velocity, health) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.health = health
  }

  drawEnemy() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.drawEnemy();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.velocity = {
      x: Math.cos(this.angle) * difficulty,
      y: Math.sin(this.angle) * difficulty
    }
  }
}




