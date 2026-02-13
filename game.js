// --- DOM elements ---
const player = document.getElementById("player");
const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const highScoreText = document.getElementById("highScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");

// --- Game state ---
let score = 0;
let lives = 3;
let highScore = parseInt(localStorage.getItem("coinHighScore") || "0", 10);
let gameOver = false;
let gameStarted = false;
let coinInterval = null;
let slowModeUntil = 0; // timestamp until which fall speed is halved

// Player position (center of the circle)
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight * 0.7;

const PLAYER_SIZE = 60;
const COIN_SIZE = 40;

// --- Init display ---
highScoreText.innerText = "High Score: " + highScore;

function updatePlayerPosition() {
  if (!player) return;
  player.style.left = (playerX - PLAYER_SIZE / 2) + "px";
  player.style.top = (playerY - PLAYER_SIZE / 2) + "px";
}

function isPlaying() {
  return gameStarted && !gameOver;
}

// --- Controls: only move when game is active ---
document.addEventListener("mousemove", function (e) {
  if (!isPlaying()) return;
  playerX = e.clientX;
  playerY = e.clientY;
  updatePlayerPosition();
});

document.addEventListener("touchmove", function (e) {
  e.preventDefault();
  if (!isPlaying()) return;
  const touch = e.touches[0];
  playerX = touch.clientX;
  playerY = touch.clientY;
  updatePlayerPosition();
}, { passive: false });

// --- Start game ---
function startGame() {
  gameOver = false;
  gameStarted = true;
  score = 0;
  lives = 3;
  slowModeUntil = 0;

  startScreen.style.display = "none";
  hud.classList.add("visible");
  player.classList.add("visible");
  gameOverScreen.classList.remove("visible");

  scoreText.innerText = "Score: " + score;
  livesText.innerText = "Lives: " + lives;
  highScoreText.innerText = "High Score: " + highScore;

  document.body.classList.add("playing");
  playerX = window.innerWidth / 2;
  playerY = window.innerHeight * 0.7;
  updatePlayerPosition();

  // Remove any old coins/powerups
  document.querySelectorAll(".coin, .powerup").forEach((el) => el.remove());

  if (coinInterval) clearInterval(coinInterval);
  coinInterval = setInterval(createCoin, 900);
}

// --- End game ---
function endGame() {
  gameOver = true;
  if (coinInterval) {
    clearInterval(coinInterval);
    coinInterval = null;
  }
  document.querySelectorAll(".coin, .powerup").forEach((el) => el.remove());

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("coinHighScore", highScore);
    highScoreText.innerText = "High Score: " + highScore;
  }

  finalScoreText.innerText = "Score: " + score + " | High Score: " + highScore;
  gameOverScreen.classList.add("visible");
  document.body.classList.remove("playing");
}

// --- Restart (button) ---
restartBtn.addEventListener("click", function () {
  startGame();
});

startBtn.addEventListener("click", function () {
  startGame();
});

// --- Spawn coins / powerups ---
function createCoin() {
  if (gameOver || !gameStarted) return;

  const coin = document.createElement("div");
  const rand = Math.random();

  if (rand < 0.1) {
    coin.classList.add("powerup", "blue");
  } else if (rand < 0.15) {
    coin.classList.add("powerup", "red");
  } else if (rand < 0.18) {
    coin.classList.add("powerup", "heart");
  } else {
    coin.classList.add("coin");
  }

  const x = Math.random() * (window.innerWidth - COIN_SIZE);
  coin.style.left = x + "px";
  coin.style.top = "0px";

  document.body.appendChild(coin);

  let fallSpeed = 2 + Math.random() * 3 + score * 0.05;

  function fall() {
    if (gameOver) {
      coin.remove();
      return;
    }

    let mult = 1;
    if (Date.now() < slowModeUntil) mult = 0.5;
    let coinTop = parseFloat(coin.style.top);
    coin.style.top = coinTop + fallSpeed * mult + "px";

    const coinRect = coin.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    // Collision
    if (
      coinRect.left < playerRect.right &&
      coinRect.right > playerRect.left &&
      coinRect.top < playerRect.bottom &&
      coinRect.bottom > playerRect.top
    ) {
      if (coin.classList.contains("blue")) {
        score += 5;
      } else if (coin.classList.contains("red")) {
        slowModeUntil = Date.now() + 3000;
      } else if (coin.classList.contains("heart")) {
        lives++;
        livesText.innerText = "Lives: " + lives;
      } else {
        score++;
      }
      scoreText.innerText = "Score: " + score;
      if (score > highScore) {
        highScore = score;
        highScoreText.innerText = "High Score: " + highScore;
      }
      coin.remove();
      return;
    }

    // Missed: below screen
    if (coinTop > window.innerHeight - COIN_SIZE) {
      if (!coin.classList.contains("powerup")) {
        lives--;
        livesText.innerText = "Lives: " + lives;
        if (lives <= 0) endGame();
      }
      coin.remove();
      return;
    }

    requestAnimationFrame(fall);
  }

  requestAnimationFrame(fall);
}
