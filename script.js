  "use strict";

console.log("Game loaded");

/* --------------------------------------------------------------------------
   Configuration
   -------------------------------------------------------------------------- */

const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 260; // Pixels per second.
const MAX_DELTA_TIME = 0.05; // Prevent large jumps after tab inactivity.

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
   Rendering
   -------------------------------------------------------------------------- */

function render() {
  context.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground();
  drawGrid();
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

resizeCanvas();
requestAnimationFrame(gameLoop);
