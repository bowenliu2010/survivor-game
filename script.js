"use strict";

console.log("Game loaded");

/* --------------------------------------------------------------------------
   Configuration
   -------------------------------------------------------------------------- */

const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 260; // Pixels per second.
const MAX_DELTA_TIME = 0.05; // Prevent large jumps after tab inactivity.
const ENEMY_RADIUS = 16;
const ENEMY_SPEED = 90; // Pixels per second.
const ENEMY_SPAWN_INTERVAL = 2; // Seconds.
const MAX_ENEMIES = 20;

/* --------------------------------------------------------------------------
   Canvas
   script.js is loaded after the canvas element in index.html, so it is safe to
   access the canvas immediately.
   -------------------------------------------------------------------------- */

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const viewport = {
  width: 0,
  height: 0,
  pixelRatio: 1,
};

/* --------------------------------------------------------------------------
   Player
   The player uses screen coordinates for this milestone. The initial position
   is assigned during resizeCanvas so it begins in the exact visible center.
   -------------------------------------------------------------------------- */

const player = {
  x: 0,
  y: 0,
  radius: PLAYER_RADIUS,
  speed: PLAYER_SPEED,
  hasBeenPositioned: false,
};

/* --------------------------------------------------------------------------
   Input
   A Set supports simultaneous key presses and immediate stopping on release.
   -------------------------------------------------------------------------- */

const pressedKeys = new Set();
const MOVEMENT_KEYS = new Set(["w", "a", "s", "d"]);

function handleKeyDown(event) {
  const key = event.key.toLowerCase();

  if (MOVEMENT_KEYS.has(key)) {
    event.preventDefault();
    pressedKeys.add(key);
  }
}

function handleKeyUp(event) {
  const key = event.key.toLowerCase();

  if (MOVEMENT_KEYS.has(key)) {
    event.preventDefault();
    pressedKeys.delete(key);
  }
}

function clearInput() {
  pressedKeys.clear();
}

window.addEventListener("keydown", handleKeyDown, { passive: false });
window.addEventListener("keyup", handleKeyUp, { passive: false });
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});

/* --------------------------------------------------------------------------
   Player update
   -------------------------------------------------------------------------- */

function updatePlayer(deltaTime) {
  let directionX = 0;
  let directionY = 0;

  if (pressedKeys.has("a")) directionX -= 1;
  if (pressedKeys.has("d")) directionX += 1;
  if (pressedKeys.has("w")) directionY -= 1;
  if (pressedKeys.has("s")) directionY += 1;

  // Normalize non-zero input so diagonal movement is not faster.
  const length = Math.hypot(directionX, directionY);
  if (length > 0) {
    directionX /= length;
    directionY /= length;
  }

  player.x += directionX * player.speed * deltaTime;
  player.y += directionY * player.speed * deltaTime;

  keepPlayerInsideCanvas();
}

function keepPlayerInsideCanvas() {
  player.x = clamp(player.x, player.radius, viewport.width - player.radius);
  player.y = clamp(player.y, player.radius, viewport.height - player.radius);
}

/* --------------------------------------------------------------------------
   Enemies
   Each enemy owns its movement and rendering behavior. The shared array keeps
   entity management simple and leaves room for later milestones to expand it.
   -------------------------------------------------------------------------- */

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = ENEMY_RADIUS;
    this.speed = ENEMY_SPEED;
  }

  update(deltaTime) {
    const directionX = player.x - this.x;
    const directionY = player.y - this.y;
    const distance = Math.hypot(directionX, directionY);

    if (distance === 0) return;

    // Dividing by distance normalizes the chase direction on every frame.
    const step = Math.min(this.speed * deltaTime, distance);
    this.x += (directionX / distance) * step;
    this.y += (directionY / distance) * step;
  }

  render() {
    const fill = context.createRadialGradient(
      this.x - 5,
      this.y - 6,
      2,
      this.x,
      this.y,
      this.radius
    );

    fill.addColorStop(0, "#ffe3e3");
    fill.addColorStop(0.35, "#ff5b67");
    fill.addColorStop(1, "#ba1830");

    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.shadowColor = "rgba(255, 38, 67, 0.9)";
    context.shadowBlur = 22;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 205, 211, 0.9)";
    context.stroke();
    context.restore();
  }
}

const enemies = [];
let enemySpawnTimer = 0;

function spawnEnemy() {
  if (enemies.length >= MAX_ENEMIES) return;

  const gap = 4;
  const edge = Math.floor(Math.random() * 4);
  let x;
  let y;

  // Place the full enemy circle beyond one randomly selected screen edge.
  if (edge === 0) {
    x = randomBetween(0, viewport.width);
    y = -ENEMY_RADIUS - gap;
  } else if (edge === 1) {
    x = viewport.width + ENEMY_RADIUS + gap;
    y = randomBetween(0, viewport.height);
  } else if (edge === 2) {
    x = randomBetween(0, viewport.width);
    y = viewport.height + ENEMY_RADIUS + gap;
  } else {
    x = -ENEMY_RADIUS - gap;
    y = randomBetween(0, viewport.height);
  }

  // The off-screen radius and gap keep the new enemy clear of the player.
  enemies.push(new Enemy(x, y));
}

function updateEnemies(deltaTime) {
  enemySpawnTimer += deltaTime;

  if (enemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
    enemySpawnTimer -= ENEMY_SPAWN_INTERVAL;
    spawnEnemy();
  }

  for (const enemy of enemies) {
    enemy.update(deltaTime);
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    enemy.render();
  }
}

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */

function render() {
  context.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground();
  drawGrid();
  drawEnemies();
  drawPlayer();
}

function drawBackground() {
  const gradient = context.createRadialGradient(
    viewport.width / 2,
    viewport.height / 2,
    0,
    viewport.width / 2,
    viewport.height / 2,
    Math.max(viewport.width, viewport.height) * 0.75
  );

  gradient.addColorStop(0, "#0d1625");
  gradient.addColorStop(1, "#070b13");
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewport.width, viewport.height);
}

function drawGrid() {
  const gridSize = 64;

  context.save();
  context.beginPath();
  context.strokeStyle = "rgba(118, 155, 202, 0.075)";
  context.lineWidth = 1;

  for (let x = 0; x <= viewport.width; x += gridSize) {
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, viewport.height);
  }

  for (let y = 0; y <= viewport.height; y += gridSize) {
    context.moveTo(0, y + 0.5);
    context.lineTo(viewport.width, y + 0.5);
  }

  context.stroke();
  context.restore();
}

function drawPlayer() {
  const fill = context.createRadialGradient(
    player.x - 6,
    player.y - 7,
    2,
    player.x,
    player.y,
    player.radius
  );

  fill.addColorStop(0, "#e8ffff");
  fill.addColorStop(0.35, "#52f4ff");
  fill.addColorStop(1, "#00a8c6");

  context.save();
  context.beginPath();
  context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.shadowColor = "rgba(0, 235, 255, 0.95)";
  context.shadowBlur = 28;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(210, 255, 255, 0.95)";
  context.stroke();
  context.restore();
}

/* --------------------------------------------------------------------------
   Resizing
   The backing canvas respects device pixel ratio while all game coordinates
   remain in CSS pixels. Existing player position is preserved and re-clamped.
   -------------------------------------------------------------------------- */

function resizeCanvas() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(viewport.width * viewport.pixelRatio);
  canvas.height = Math.round(viewport.height * viewport.pixelRatio);
  context.setTransform(viewport.pixelRatio, 0, 0, viewport.pixelRatio, 0, 0);

  if (!player.hasBeenPositioned) {
    player.x = viewport.width / 2;
    player.y = viewport.height / 2;
    player.hasBeenPositioned = true;
  }

  keepPlayerInsideCanvas();
  render();
}

window.addEventListener("resize", resizeCanvas);

/* --------------------------------------------------------------------------
   Game loop
   -------------------------------------------------------------------------- */

let previousTime = performance.now();

function gameLoop(currentTime) {
  const elapsedSeconds = (currentTime - previousTime) / 1000;
  const deltaTime = Math.min(elapsedSeconds, MAX_DELTA_TIME);
  previousTime = currentTime;

  updatePlayer(deltaTime);
  updateEnemies(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}

/* --------------------------------------------------------------------------
   Utilities and startup
   -------------------------------------------------------------------------- */

function clamp(value, minimum, maximum) {
  // Small viewports can be narrower than the player's diameter.
  if (maximum < minimum) return (minimum + maximum) / 2;
  return Math.min(Math.max(value, minimum), maximum);
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

resizeCanvas();
requestAnimationFrame(gameLoop);
