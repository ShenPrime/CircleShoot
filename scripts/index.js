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

    //TODO: turn this into a function
    //enemy x and y coordinates
    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
      x = Math.random() * canvas.width;
    }

    //TODO: turn this in a function
    let randomColor = Math.random() * 360;
    const color = `hsl(${randomColor}, 50%, 50%`;

    const angle = Math.atan2(player.y - y, player.x - x); //calculate angle based on player position - enemy spawn
                                                          // position
    let velocity = {
      // use the angle to determine the direction and velocity of the enemy (to move towards the player)
      x: Math.cos(angle) * difficulty,
      y: Math.sin(angle) * difficulty,
    };

    enemies.push(new Enemy(x, y, radius, color, velocity, health)); // create a new enemy object based on the above
                                                                    // variables ( it will spawn every 1 second
                                                                    // from a random spot outside the canvas
                                                                    // boundries and move in)
  }, 600);
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

  //TODO create function for all updates
  powerUps.forEach((ele) => {
    ele.update();
  });

  projectiles.forEach((ele) => {
    ele.update();
  });

  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update();

    //TODO: create checkCollision function that returns true/false takes in objects as input (player, enemy,
    // projectile...etc)
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y); //calculate distance by subtracting enemy
                                                                     // position from player position (x, y)
    if (dist - enemy.radius - player.radius < 1 && player.lives <= 0) {
      //collision check, if player has 0 health, freeze animation and end the game
      gameOver();
    } else if (dist - enemy.radius - player.radius < 1 && player.lives > 0) {
      //if player has health > 0, destroy enemy and remove 1 health from player

      //TODO: create playerCollisionEffects function
      setTimeout(() => {
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
      }, 0);
    }

    projectiles.forEach((projectile, proIndex) => {
      //TODO: create getDistance function that returns distance. Takes in coordinates as input
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y); //same distance calculation as
                                                                               // above, but this one is for
                                                                               // projectiles and enemies

      if (dist - enemy.radius - projectile.radius < 1 && enemy.health === 0) {
        let chance = Math.round(Math.random() * 35); //create a random number generator on enemy death

        //TODO create checkforDroppedPowerUps function
        if (
            chance > 1 &&
            player.hasPowerUp === false &&
            powerUpDropped === false
        ) {
          //TODO: create dropPowerUp function
          powerUpDropped = true;
          powerUps.push(
              new RandomDrops(
                  projectile.x,
                  projectile.y,
                  15,
                  randomDrops[Math.floor(Math.random() * randomDrops.length)] //push random powerup into the
                  // powerup array
              )
          );
        }

        //TODO: Create triggerExplosion function takes in projectile, enemy? obj as input
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

        setTimeout(() => {
          enemies.splice(index, 1);
          projectiles.splice(proIndex, 1);
          player.score += 10;
        }, 0);
      } else if (
          dist - enemy.radius - projectile.radius < 1 &&
          enemy.health > 0
      ) {
        //TODO: Shrink Enemy radius with a function shrinkEnemy?
        enemy.radius -= 20;
        enemy.health -= 1;
        player.score += 20;
        projectiles.splice(proIndex, 1);

        for (let i = 0; i < 8; i++) {
          particles.push(
              new Particle(projectile.x, projectile.y, 3, enemy.color, {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              })
          );
        }

      }
    });
  });

  //TODO: better naming! Also turn this into a function
  projectiles.forEach((ele, proIndex) => {
    // destroy projectiles when they leave screen boundries by looping through the projectile array and checking
    // each projectile position TODO: destroy projectile
    if (ele.x + ele.radius > canvas.width) {
      setTimeout(() => {
        projectiles.splice(proIndex, 1);
      });
    }

    if (ele.x - ele.radius < 0) {
      setTimeout(() => {
        projectiles.splice(proIndex, 1);
      });
    }

    if (ele.y + ele.radius > canvas.height) {
      setTimeout(() => {
        projectiles.splice(proIndex, 1);
      });
    }

    if (ele.y - ele.radius < 0) {
      setTimeout(() => {
        projectiles.splice(proIndex, 1);
      });
    }
  });

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
  //TODO: create function to set non-game element's display to none
  strtBtn.style.display = "none";
  strtScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  canvas.style.display = "block";
  pauseScreen.style.display = "none";
  animate();
  spawnEnemies();

  //TODO: rename this to something more clear
  increaseDifficulty();
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
