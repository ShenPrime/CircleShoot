//----------------- DOM RELATED -------------------------

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d");
const strtBtn = document.querySelector(".strtBtn");
const strtScreen = document.querySelector(".startGame");
const gameOverScreen = document.querySelector(".gameOver");
const restartBtn = document.querySelector(".restartBtn");
const endScore = document.querySelector(".score");
const pauseScreen = document.querySelector(".pause");
const pauseScore = document.querySelector(".pauseScore");
// const powerUpDiv = document.querySelector('.powerup');
// const powerUpName = document.querySelector('.powerUpName')
// const timerText = document.querySelector('.timer')
canvas.height = innerHeight - 3;
canvas.width = innerWidth;

//-------------------------------------------------------

// ---------------------- AUDIO -------------------------

let audio = new Audio("./audio/Sub - Mini Impact-[AudioTrimmer.com] (1).wav");
let backgroundAudio = new Audio("./audio/Sweet baby kicks PSG.mp3");

//-------------------------------------------------------------------------

// ------------- Variables for collision and movement -------//

let isLeft = false;
let isRight = false;
let isUp = false;
let isDown = false;

// -------------------------------------------------------------

// ------------------ misc variables ----------------------------

//TODO: figure what these two are
let proRadius = 5;
let proDamage = 1;
let difficulty = 2;
let rapidFire = false;

let animationID;
let isRunning = true;

// --------------------------------------------------------------

//----------------------- Power Up variables---------------------

let timer = 0;
let timer2 = 0;
let speedID = 0;
let cannonID = 0;
let healthID = 0;
let damageID = 0;
let tinyID = 0;
let invincibleID = 0;
let powerUpDropped = false;

//TODO: find a place for me!
let enemiesID = 0;

//---------------------------------------------------------------

// ------------------ Player Spawn and coordinates ------------------------

let x = canvas.width / 2;
let y = canvas.height / 2;
let player = new Player(x, y, 15, "white");

//-------------------------------------------------------------------------

//------------------------ Arrays for spawning game objects ---------------------

let projectiles = [];
let enemies = [];
let particles = [];
let powerUps = [];
let randomDrops = ['speed', 'tiny', 'health', 'cannon', 'invincible'];
// let randomDrops = ['rapidFire'];


//---------------------------------------------------------------------------------

function spawnEnemies() {
    enemiesID = setInterval(() => {
        //TODO: Why in the hell does this start with 0 instead of 1?
        let health = 1;
        let radius = getRandomNumber(40);

        if (radius < 10) {
            radius += 10;
        }

        if (radius > 30) {
            health = 2;
        }

        const [x, y] = getEnemyCoordinates(radius);
        const color = getRandomColor();
        const angle = getAngle(player, x, y);
        let velocity = getVelocity(x, y, angle, difficulty);
        createEnemy(enemies, x, y, radius, color, velocity, health);

    }, 600);
}

//TODO: Figure out a proper formula for difficulty
function increaseDifficulty() {
    if (player.score > 500 && player.score < 1000 && difficulty < 2.5) {
        difficulty += 0.5;
    }

    if (player.score > 1000 && player.score < 1500 && difficulty < 3) {
        difficulty += 0.5;
    }

    if (player.score > 1500 && player.score < 2500 && difficulty < 4) {
        difficulty++;
    }

    if (player.score > 2500 && player.score < 3000 && difficulty < 5) {
        difficulty++;
    }

    if (player.score > 3000 && player.score < 5000 && difficulty < 7) {
        difficulty += 2;
    }
}

function playerMovement() {
    if (isRight && player.x + player.radius < canvas.width) {
        player.x += player.velocity;
    }

    if (isLeft && player.x - player.radius > 0) {
        player.x -= player.velocity;
    }

    if (isUp && player.y - player.radius > 0) {
        player.y -= player.velocity;
    }

    if (isDown && player.y + player.radius < canvas.height) {
        player.y += player.velocity;
    }
}

//--------------------------------- MAIN GAME LOOP AND ANIMATION
// ----------------------------------------------------------

function animate() {
    //TODO: Investigate this
    backgroundAudio.play();
    backgroundAudio.volume = 0.1;

    //---------------------------------
    animationID = requestAnimationFrame(animate);
    //--------------- blur effect ------------

    ctx.fillStyle = "rgba(0,0,0,0.3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //------------------------------------------
    //-------------game object draw functions -----------

    player.drawPlayer();
    drawStats(); //Draw difficulty, lives, score
    increaseDifficulty();
    playerMovement();

    //------------------------------------------------------

    updateElements(powerUps);
    updateElements(projectiles);

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            deleteGameObjectFromArray(particles, index);
        } else {
            particle.update();
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = getDistance(player, enemy);
        const collision = checkCollision(player, enemy, dist);

        if (collision && player.isInvincible) {
            handleInvincibleCollision(player, enemies, index, enemy);
        }

        if (collision && player.lives <= 0 && !player.isInvincible) {
            gameOver();
        } else if (collision && player.lives > 0 && !player.isInvincible) {
            setTimeout(() => {
                handleCollision(player, enemies, timer, index, damageID);
            }, 0);
        }

        projectiles.forEach((projectile, proIndex) => {
            const dist = getDistance(enemy, projectile);
            const projectileCollision = checkCollision(enemy, projectile, dist);
            if (projectileCollision) {
                enemy.takeDamage(proDamage)
                if (enemy.health >= 1) {
                    shrinkEnemy(enemy)
                    increasePlayerScore(20, player);
                    deleteGameObjectFromArray(projectiles, proIndex);
                    createNewParticles(particles, projectile, enemy);
                } else {

                    let dropChance = getRandomNumber(3);
                    const powerUpStatus = checkPowerUpStatus(player);


                    if (dropChance === 1 && powerUpStatus === true) {
                        dropPowerUp(projectile);
                    }

                    triggerExplosion(particles, projectile, enemy);
                    setTimeout(() => {
                        deleteGameObjectFromArray(enemies, index);
                        deleteGameObjectFromArray(projectiles, proIndex);
                        increasePlayerScore(10, player);
                    }, 0);

                }

            }
        });
    });

    cleanUpOutOfBoundsProjectiles(projectiles, canvas);

    powerUps.forEach((drop, index) => {
        let powerUpDist = getDistance(player, drop);

        if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'health') {
            addHealth(player);
            changePlayerColor(player, 'green');
            deleteGameObjectFromArray(powerUps, index);
            healthID = setInterval(() => {
                timer++;

                if (timer === 3) {
                    clearInterval(healthID);
                    changePlayerColor(player, 'white');
                    timer = 0;
                    changePowerUpStatus(player, false);
                    powerUpDropped = false;
                }

            }, 100);

        } else if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'speed') {
            //the speed drop sets the move speed to 6 for 20 seconds
            changePowerUpStatus(player, true);
            changePlayerSpeed(player, 6);
            deleteGameObjectFromArray(powerUps, index);
            speedID = setInterval(() => {
                timer++;
                // drawPowerUpText(drop.name, canvas, timer);

                if (timer === 20) {
                    clearInterval(speedID);
                    changePlayerSpeed(player, 3);
                    timer = 0;
                    changePowerUpStatus(player, false);
                    powerUpDropped = false;
                }

            }, 1000);


        } else if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'cannon') {
            changePowerUpStatus(player, true);
            changeProjectileRadius(30);
            proDamage = 2;
            deleteGameObjectFromArray(powerUps, index);
            cannonID = setInterval(() => {
                timer++;

                if (timer === 20) {
                    clearInterval(cannonID);
                    proDamage = 1;
                    changeProjectileRadius(5);
                    timer = 0;
                    changePowerUpStatus(player, false);
                    powerUpDropped = false;
                }

            }, 1000);
        } else if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'tiny') {
            changePowerUpStatus(player, true);
            player.setRadius(5);
            deleteGameObjectFromArray(powerUps, index);
            tinyID = setInterval(() => {
                timer++;

                if (timer === 10) {
                    clearInterval(tinyID);
                    player.setRadius(15);
                    timer = 0;
                    changePowerUpStatus(player, false);
                    powerUpDropped = false;
                }

            }, 1000)
        } else if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'invincible') {
            //turn player multicolored
            changePowerUpStatus(player, true);
            player.setIsInvincible(true);
            deleteGameObjectFromArray(powerUps, index);
            let playerRandomColors = setInterval(() => {
                player.setColor(`hsl(${Math.random() * 360}, 50%, 50%)`)
            }, 50)
            invincibleID = setInterval(() => {
                timer++;

                if (timer === 5) {
                    clearInterval(playerRandomColors);
                    clearInterval(invincibleID);
                    player.setIsInvincible(false);
                    player.setColor('white');
                    timer = 0;
                    changePowerUpStatus(player, false);
                    powerUpDropped = false;
                }
            }, 1000);
        }
        // } else if (powerUpDist - drop.radius - player.radius < 1 && drop.name === 'rapidFire') {
        //     changePowerUpStatus(player, true);
        //     //set rapidFire boolean to true
        //     //start a timer for 10 seconds
        //     //when timer reaches 10:
        //     // reset powerups, timer, powerupDropped, clearInterval
        // }
    });
}


//-------------------------------------------------------------------------------------------------------------------------

function shootProjectile() {
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    const color = 'red';
    let velocity = {
        x: Math.cos(angle) * 10,
        y: Math.sin(angle) * 10,
    };
    createProjectile(projectiles, player, proRadius, color, velocity);
}

function startGame() {
    hideElements([strtBtn, strtScreen, gameOverScreen, pauseScreen]);
    revealElements([canvas]);
    animate();
    spawnEnemies();

    //TODO: rename this to something more clear
    increaseDifficulty();
}

function gameOver() {
    cancelAnimationFrame(animationID);
    stopIntervals([enemiesID, cannonID, speedID, healthID, damageID]);
    stopAudio(backgroundAudio);
    hideElements([canvas]);
    revealElements([gameOverScreen]);
    changeElementInnerText(endScore, player.score);
    resetArrays([projectiles, enemies, particles, powerUps]); //TODO: fix visual bug related to this
    resetTimers([timer, timer2]);
    player = createNewPlayer(canvas);
    powerUpDropped = false;
    difficulty = 2;
    proRadius = 5;
}

function pause() {
    isRunning = !isRunning;

    if (isRunning) {
        animate();

    } else {
        cancelAnimationFrame(animationID);
        clearInterval(enemiesID);
        backgroundAudio.pause();
        hideElements([canvas]);
        revealElements([pauseScreen]);
        changeElementInnerText(pauseScore, player.score);
    }

}

window.addEventListener("load", () => {
    hideElements([canvas, gameOverScreen, pauseScreen]);

    restartBtn.addEventListener("click", () => {
        hideElements([gameOverScreen]);
        startGame();
    });

    strtBtn.addEventListener("click", () => {
        startGame();
    });

    addEventListener("click", (event) => {
        shootProjectile(event);
        setAudio(audio);
    });

    addEventListener("keydown", (event) => {
        if (event.key === "a" || event.key === 'ArrowLeft') {
            isLeft = true;
        }

        if (event.key === "d" || event.key === 'ArrowRight') {
            isRight = true;
        }

        if (event.key === "w" || event.key === 'ArrowUp') {
            isUp = true;
        }

        if (event.key === "s" || event.key === 'ArrowDown') {
            isDown = true;
        }

    });

    addEventListener("keyup", (event) => {
        if (event.key === "a" || event.key === "ArrowLeft") {
            isLeft = false;
        }

        if (event.key === "d" || event.key === "ArrowRight") {
            isRight = false;
        }

        if (event.key === "w" || event.key === "ArrowUp") {
            isUp = false;
        }

        if (event.key === "s" || event.key === "ArrowDown") {
            isDown = false;
        }
    });

    addEventListener("keypress", (event) => {
        if (event.key === "x") {

            if (isRunning) {
                pause();
            }

        }

    });

    addEventListener("keypress", (event) => {
        if (event.key === "z") {

            if (!isRunning) {
                //TODO: handleGameIsRunning function
                pause();
                backgroundAudio.pause();
                revealElements([canvas]);
                hideElements([pauseScreen]);
                spawnEnemies();
            }

        }

    });

});
