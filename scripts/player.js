class Player {
    constructor(x, y, radius = 15, color = 'white') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = 3;
        this.lives = 3
        this.score = 0;
        this.hasPowerUp = false;
    }

    drawPlayer() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}
