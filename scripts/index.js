//----------------- DOM RELATED -------------------------

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const strtBtn = document.querySelector(".strtBtn");
const strtScreen = document.querySelector(".startGame");
const gameOverScreen = document.querySelector(".gameOver");
const restartBtn = document.querySelector(".restartBtn");
const endScore = document.querySelector(".score");
const pauseScreen = document.querySelector(".pause");
const pauseScore = document.querySelector(".pauseScore");
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
let difficulty = 2;

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
let randomDrops = ["health", "speed", "cannon"];

//---------------------------------------------------------------------------------

function spawnEnemies() {
    enemiesID = setInterval(() => {
        //TODO: Why in the hell does this start with 0 instead of 1?
        let health = 0;
        let radius = Math.floor(Math.random() * 40);

        if (radius < 10) {
            radius += 10;
        }

        if (radius > 30) {
            health = 1;
        }

        //enemy x and y coordinates
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

    //TODO: consider turning this into somekind of player related function
    player.drawPlayer();
    drawStats(); //Draw difficulty, lives, score
    increaseDifficulty();
    playerMovement();

    //------------------------------------------------------

    function updateElements(eleArray) {
        eleArray.forEach(ele => ele.update());
    }

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

        if (collision && player.lives <= 0) {
            gameOver();
        } else if (collision && player.lives > 0) {
            setTimeout(() => {
                handleCollision(player, enemies, timer, index, damageID);
            }, 0);
        }

        projectiles.forEach((projectile, proIndex) => {
            const dist = getDistance(enemy, projectile);
            const projectileCollision = checkCollision(enemy, projectile, dist);

            if (projectileCollision && enemy.health === 0) {
                let dropChance = getRandomNumber(10);
                const powerUpStatus = checkPowerUpStatus(player);

                if (dropChance === 5 && powerUpStatus === true) {
                    dropPowerUp(projectile);
                }

                triggerExplosion(particles, projectile, enemy);
                setTimeout(() => {
                    deleteGameObjectFromArray(enemies, index);
                    deleteGameObjectFromArray(projectiles, proIndex);
                    increasePlayerScore(10, player);
                }, 0);

            } else if (projectileCollision && enemy.health > 0) {
                shrinkEnemy(enemy);
                increasePlayerScore(20, player);
                deleteGameObjectFromArray(projectiles, proIndex);
                createNewParticles(particles, projectile, enemy);
            }
        });
    });

    cleanUpOutOfBoundsProjectiles(projectiles, canvas);

    //TODO: create function that checks if playing picked up powerup
    powerUps.forEach((drop, index) => {
        //check if player collides with powerup by looping through powerup array and checking position relative to
        // player position TODO: create function getPowerUpPosition
        let powerUpDist = Math.hypot(player.x - drop.x, player.y - drop.y);

        if (
            powerUpDist - drop.radius - player.radius < 1 &&
            drop.name === "health"
        ) {
            //TODO: create function addHealth
            //the health drop adds one health to the player
            player.lives += 1;
            player.color = "green";
            powerUps.splice(index, 1);
            healthID = setInterval(() => {
                timer++;

                //TODO: figure out wtf is happening here
                if (timer === 3) {
                    clearInterval(healthID);
                    player.color = "white";
                    timer = 0;
                    player.hasPowerUp = false;
                    powerUpDropped = false;
                }

            }, 100);

        } else if (
            powerUpDist - drop.radius - player.radius < 1 &&
            drop.name === "speed"
        ) {
            //the speed drop sets the move speed to 6 for 20 seconds
            player.hasPowerUp = true;
            player.velocity = 6;
            powerUps.splice(index, 1);
            speedID = setInterval(() => {
                timer++;

                if (timer === 20) {
                    clearInterval(speedID);
                    player.velocity = 3;
                    timer = 0;
                    player.hasPowerUp = false;
                    powerUpDropped = false;
                }

            }, 1000);

        } else if (
            //the cannon drop increases projectile radius to 20 for 20 seconds
            powerUpDist - drop.radius - player.radius < 1 &&
            drop.name === "cannon"
        ) {
            player.hasPowerUp = true;
            proRadius = 30;
            powerUps.splice(index, 1);
            cannonID = setInterval(() => {
                timer++;

                if (timer === 20) {
                    clearInterval(cannonID);
                    proRadius = 5;
                    timer = 0;
                    player.hasPowerUp = false;
                    powerUpDropped = false;
                }

            }, 1000);
        }
    });
}

//-------------------------------------------------------------------------------------------------------------------------

function shootProjectile() {
    //same calculations for enemy movement to follow player. but for projectiles they move towards the mouse click
    // coordinates (clientY, clientX ) TODO: create getAngle function
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    let velocity = {
        x: Math.cos(angle) * 10,
        y: Math.sin(angle) * 10,
    };
    projectiles.push(
        new Projectile(player.x, player.y, proRadius, "red", velocity)
    );
}

function startGame() {
    hideElements([strtBtn, strtScreen, gameOverScreen, pauseScreen]);
    revealElements([canvas]);
    animate();
    spawnEnemies();

    //TODO: rename this to something more clear
    increaseDifficulty();
}

function hideElements(elementsArray) {
    elementsArray.forEach(element => element.style.display = 'none');
}

function revealElements(elementsArray) {
    elementsArray.forEach(element => element.style.display = 'block');
}

function gameOver() {
    cancelAnimationFrame(animationID);

    //TODO: put all this in a stopAllIntervals function
    clearInterval(enemiesID);
    clearInterval(cannonID);
    clearInterval(speedID);
    clearInterval(healthID);
    clearInterval(damageID);

    //TODO: backgroundAudioSTOP function for this
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;

    //TODO: function for this
    canvas.style.display = "none";
    gameOverScreen.style.display = "block";
    endScore.innerText = `${player.score}`;

    //TODO: resetArrays function for this
    projectiles = [];
    enemies = [];
    particles = [];
    powerUps = [];

    //TODO: resetPlayerPosition function for this
    x = canvas.width / 2;
    y = canvas.height / 2;
    player = new Player(x, y, 15, "white");
    powerUpDropped = false;
    player.hasPowerUp = false;

    //?
    difficulty = 2;
    proRadius = 5;

    //TODO: resetTimers function
    timer = 0;
    timer2 = 0;

}

function pause() {
    isRunning = !isRunning;

    if (isRunning) {
        animate();

    } else {
        cancelAnimationFrame(animationID);
        clearInterval(enemiesID);
    }

}

window.addEventListener("load", () => {
    canvas.style.display = "none";
    gameOverScreen.style.display = "none";
    pauseScreen.style.display = "none";

    restartBtn.addEventListener("click", () => {
        gameOverScreen.style.display = "none";
        startGame();
    });

    strtBtn.addEventListener("click", () => {
        startGame();
    });

    addEventListener("click", (event) => {
        shootProjectile();
        //TODO: function to handle audio settings
        audio.currentTime = 0;
        audio.play();
        audio.volume = 0.1;
        audio.playbackRate = 1;
    });

    addEventListener("keydown", (event) => {
        //TODO: key = pressedKey()
        //TODO: switch statement to handle behavior based on keyPressed
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
        //TODO: same thing as the keydown
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
        //TODO: pressedKey function
        if (event.key === "x") {

            if (isRunning) {
                //TODO: handleGameIsPaused Function
                pause();
                backgroundAudio.pause();
                canvas.style.display = "none";
                pauseScreen.style.display = "block";
                pauseScore.innerText = `${player.score}`;
            }

        }

    });

    addEventListener("keypress", (event) => {
        if (event.key === "z") {

            if (!isRunning) {
                //TODO: handleGameIsRunning function
                pause();
                backgroundAudio.pause();
                canvas.style.display = "block";
                pauseScreen.style.display = "none";
                spawnEnemies();
            }

        }

    });

});
