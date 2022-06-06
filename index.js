// Get the canvas tag
const canvas = document.querySelector("#container-game");

// Get the 2d context of the canvas
const ctx = canvas.getContext("2d");

// Put the canvas dimensions equal to the window dimensions
canvas.width = innerWidth;
canvas.height = innerHeight;

// DOM elements for UI
const scoreEl = document.getElementById("scoreEl");
const startGameBtn = document.getElementById("startGameBtn");
const modalEl = document.getElementById("modalEl");
const bigScoreEl = document.getElementById("bigScoreEl");

class Entity {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = "red";
  }

  // method to draw a disc inside the canvas
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Player extends Entity {
  constructor(x, y, radius, color) {
    super(x, y, radius);
    this.color = color;
  }
}

class Projectile extends Player {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  // method to update the position of the disc by adding the velocity to the x and y coordinates
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends Projectile {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
  }
}

class Particle extends Enemy {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

let player = new Player(canvas.width / 2, canvas.height / 2, 10, "white");
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  player = new Player(canvas.width / 2, canvas.height / 2, 10, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreEl.innerText = score;
  bigScoreEl.innerText = score;
}

// function to generate every second a new enemy coming from outside of the screen randomly
function spawnEnemies() {
  setInterval(() => {
    // random radius
    const radius = Math.random() * (30 - 4) + 4;

    // random red, green and blue value
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    // random rgb color
    const color = `rgb(${r}, ${g}, ${b})`;

    // random value to generate the x and y coordinates
    const randomValue = Math.random();
    let x, y;
    if (randomValue < 0.25) {
      x = 0 - radius;
      y = Math.random() * canvas.height;
    } else if (randomValue >= 0.25 && randomValue < 0.5) {
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
    } else if (randomValue >= 0.5 && randomValue < 0.75) {
      x = Math.random() * canvas.width;
      y = 0 - radius;
    } else if (randomValue >= 0.75) {
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
    }

    // calcul of the velocity
    const angle = Math.atan2(player.y - y, player.x - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    // add a new enemy in enemies array
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

let animationId;
let score = 0;
// animate function executed recursively
function animate() {
  animationId = requestAnimationFrame(animate);

  // fill the canvas with a rectangle
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw the player in the canvas
  player.draw();

  // go through the particles array to update all particle positions
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  // go through the projectiles array to update all projectile positions
  projectiles.forEach((projectile, index) => {
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x + projectile.radius > canvas.width ||
      projectile.y - projectile.radius < 0 ||
      projectile.y + projectile.radius > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
    projectile.update();
  });

  // go through the enemies array to update all enemy positions
  enemies.forEach((enemy, enemyIndex) => {
    // detection of collision between a projectile and an enemy
    projectiles.forEach((projectile, projectileIndex) => {
      const distance = Math.hypot(
        projectile.x - enemy.x,
        projectile.y - enemy.y
      );
      if (distance - projectile.radius - enemy.radius <= 0) {
        // particles creation
        for (let i = 0; i < 8; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * (3 - 1) + 1,
              enemy.color,
              {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
              }
            )
          );
        }
        // reduce the radius of enemy or remove enemy
        if (enemy.radius - 10 > 5) {
          // increase our score
          score += 100;
          scoreEl.innerText = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          // increase our score
          score += 250;
          scoreEl.innerText = score;
          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });

    // detection of collision between the player and an enemy
    const distPlayerEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    // end game
    if (distPlayerEnemy - enemy.radius - player.radius <= 0) {
      cancelAnimationFrame(animationId);
      bigScoreEl.innerText = score;
      startGameBtn.innerText = "Restart Game";
      modalEl.style.display = "flex";
    }
    enemy.update();
  });
}

// click listener to add a new projectile in direction of the mouse pointer
window.addEventListener("click", (event) => {
  const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  // create new projectile
  const projectile = new Projectile(player.x, player.y, 5, "white", velocity);
  projectiles.push(projectile);
});

startGameBtn.addEventListener("click", () => {
  init();
  modalEl.style.display = "none";
  animate();
  spawnEnemies();
});
