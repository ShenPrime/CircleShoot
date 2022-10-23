function createEnemy(enemiesArray, x, y, radius, color, velocity, health) {
    enemiesArray.push(new Enemy(x, y, radius, color, velocity, health)); // create a new enemy object based on the above
}

function getVelocity(x, y, angle, difficulty) {
    return {
        x: Math.cos(angle) * difficulty,
        y: Math.sin(angle) * difficulty,
    }
}

function getAngle(obj, x, y) {
    return Math.atan2(obj.y - y, obj.x - x);
}

function getEnemyCoordinates(radius) {
    let x;
    let y;

    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        x = Math.random() * canvas.width;
    }
    return [x, y]

}

function getRandomColor() {
    let randomColor = Math.random() * 360;
    return `hsl(${randomColor}, 50%, 50%`;
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Montserrat";
    ctx.fillText(`Score: ${player.score}`, 10, 30);
}

function drawLives() {
    ctx.fillStyle = "white";
    ctx.font = "20px Montserrat";
    ctx.fillText(`Lives : ${player.lives}`, 10, 70);
}

function drawDifficulty() {
    ctx.fillStyle = "white";
    ctx.font = "20px Montserrat";
    ctx.fillText(`Difficulty : ${difficulty}`, 10, 110);
}

function drawStats() {
    drawScore();
    drawDifficulty();
    drawLives();
}
function createNewParticles(particles, projectile, enemy) {
    for (let i = 0; i < 8; i++) {
        particles.push(
            new Particle(projectile.x, projectile.y, 3, enemy.color, {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
            })
        );
    }

}

function shrinkEnemy(enemy) {
    enemy.radius -= 20;
    enemy.health -= 1;
}

function deleteGameObjectFromArray(array, index) {
    array.splice(index, 1);
}

function increasePlayerScore(val, player) {
    player.score += val;
}

function getRandomNumber(pool) {
    return Math.round(Math.random() * pool);
}

function checkPowerUpStatus(player) {
    return player.hasPowerUp === false && powerUpDropped === false
}

function dropPowerUp(projectile) {
    powerUpDropped = true;
    powerUps.push(
        new RandomDrops(
            projectile.x,
            projectile.y,
            15,
            randomDrops[Math.floor(Math.random() * randomDrops.length)]
        )
    );
}

function triggerExplosion(particles, projectile, enemy) {

    for (let i = 0; i < 25; i++) {
        particles.push(
            //push particles into the particle array when a projectile collides with an enemy. this
            // produces explosion effect
            new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 4,
                enemy.color,
                {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 0.5) * (Math.random() * 6),
                }
            )
        );
    }
}

function handleCollision(player, enemies, timer, index, damageID) {
    player.lives -= 1;
    enemies.splice(index, 1);
    player.color = "red";
    damageID = setInterval(() => {
        timer2++;

        if (timer2 === 3) {
            clearInterval(damageID);
            player.color = "white";
            timer2 = 0;
        }

    }, 100);
}

function checkCollision(player, enemy, dist) {
    return dist - enemy.radius - player.radius < 1;
}

function getDistance(obj1, obj2) {
    return Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
}

function cleanUpOutOfBoundsProjectiles(projectilesArray, canvas) {
    projectilesArray.forEach((projectile, proIndex) => {
        if (projectile.x + projectile.radius > canvas.width) {
            setTimeout(() => {
                deleteGameObjectFromArray(projectiles, proIndex);
            });
        }

        if (projectile.x - projectile.radius < 0) {
            setTimeout(() => {
                deleteGameObjectFromArray(projectiles, proIndex);
            });
        }

        if (projectile.y + projectile.radius > canvas.height) {
            setTimeout(() => {
                deleteGameObjectFromArray(projectiles, proIndex);
            });
        }

        if (projectile.y - projectile.radius < 0) {
            setTimeout(() => {
                deleteGameObjectFromArray(projectiles, proIndex);
                projectiles.splice(proIndex, 1);
            });
        }
    });
}
