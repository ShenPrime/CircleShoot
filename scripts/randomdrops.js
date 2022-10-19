class RandomDrops {
  constructor(x, y, radius, name) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    this.name = name;
  }

  drawDrop() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.drawDrop();
    this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
  }
}
