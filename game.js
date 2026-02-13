let player = document.getElementById("player");
let scoreText = document.getElementById("score");
let livesText = document.getElementById("lives");
let highScoreText = document.getElementById("highScore");
let gameOverText = document.getElementById("gameOver");
let restartBtn = document.getElementById("restartBtn");
let startScreen = document.getElementById("startScreen");
let startBtn = document.getElementById("startBtn");
let hud = document.getElementById("hud");

let score = 0;
let lives = 3;
let highScore = parseInt(localStorage.getItem("coinHighScore")) || 0;
highScoreText.innerText = `High Score: ${highScore}`;
let gameOver = false;
let coinInterval;
let slowUntil = 0;

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight * 0.85;

function updatePlayerPosition() {
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  scoreText.innerText = "Score: 0";
  livesText.innerText = "Lives: 3";
  playerX = window.innerWidth / 2;
  playerY = window.innerHeight * 0.85;
  updatePlayerPosition();
}

function startGame() {
  resetGame();
  hud.style.display = "block";
  player.style.display = "block";
  startScreen.style.display = "none";
  gameOverText.style.display = "none";
  restartBtn.style.display = "none";
  if (coinInterval) clearInterval(coinInterval);
  coinInterval = setInterval(createCoin, 800);
}

function endGame() {
  clearInterval(coinInterval);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("coinHighScore", highScore);
    highScoreText.innerText = `High Score: ${highScore}`;
  }
  gameOverText.style.display = "block";
  restartBtn.style.display = "block";
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// Mouse movement (left/right only, clamped)
document.addEventListener("mousemove", function(e) {
  if (!gameOver) {
    playerX = e.clientX;
    playerX = Math.max(30, Math.min(window.innerWidth - 30, playerX));
    updatePlayerPosition();
  }
});

// Touch movement (prevent scroll, left/right only)
document.addEventListener("touchmove", function(e) {
  e.preventDefault();
  if (!gameOver && e.touches.length > 0) {
    let touch = e.touches[0];
    playerX = touch.clientX;
    playerX = Math.max(30, Math.min(window.innerWidth - 30, playerX));
    updatePlayerPosition();
  }
}, { passive: false });

// Prevent touch scrolling
document.addEventListener("touchstart", function(e) {
  e.preventDefault();
}, { passive: false });
document.addEventListener("touchend", function(e) {
  e.preventDefault();
}, { passive: false });

// Resize handler
window.addEventListener("resize", function() {
  playerY = window.innerHeight * 0.85;
  playerX = Math.max(30, Math.min(window.innerWidth - 30, playerX));
  updatePlayerPosition();
});

// Create coins or powerups
function createCoin() {
  if (gameOver) return;

  let coin = document.createElement("div");
  let rand = Math.random();
  if (rand < 0.1) {
    coin.classList.add("powerup", "blue"); // +5 points
  } else if (rand < 0.15) {
    coin.classList.add("powerup", "red"); // slow down falling globally for 3s
  } else if (rand < 0.18) {
    coin.classList.add("powerup", "heart"); // +1 life
  } else {
    coin.classList.add("coin");
  }

  let x = Math.random() * (window.innerWidth - 40);
  coin.style.left = x + "px";
  coin.style.top = "0px";

  document.body.appendChild(coin);

  let fallSpeed = 2 + Math.random() * 3 + score * 0.01;
  if (Date.now() < slowUntil) fallSpeed *= 0.3;

  function fall() {
    if (gameOver) {
      coin.remove();
      return;
    }

    let coinTop = parseFloat(coin.style.top) || 0;
    coin.style.top = (coinTop + fallSpeed) + "px";

    let coinRect = coin.getBoundingClientRect();
    let playerRect = player.getBoundingClientRect();

    // Collision detection
    if (
      coinRect.left < playerRect.right &&
      coinRect.right > playerRect.left &&
      coinRect.top < playerRect.bottom &&
      coinRect.bottom > playerRect.top
    ) {
      if (coin.classList.contains("blue")) {
        score += 5;
      } else if (coin.classList.contains("red")) {
        slowUntil = Date.now() + 3000;
        score += 3;
      } else if (coin.classList.contains("heart")) {
        lives++;
        livesText.innerText = `Lives: ${lives}`;
      } else {
        score++;
      }
      scoreText.innerText = `Score: ${score}`;
      coin.remove();
      return;
    }

    // Missed coin
    if (coinRect.bottom > window.innerHeight) {
      if (!coin.classList.contains("powerup")) {
        lives--;
        livesText.innerText = `Lives: ${lives}`;
        if (lives <= 0) {
          endGame();
        }
      }
      coin.remove();
      return;
    }

    requestAnimationFrame(fall);
  }

  requestAnimationFrame(fall);
}
