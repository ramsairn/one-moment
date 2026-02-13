let player = document.getElementById("player");
let scoreText = document.getElementById("score");
let livesText = document.getElementById("lives");
let highScoreText = document.getElementById("highScore");
let gameOverText = document.getElementById("gameOver");
let restartBtn = document.getElementById("restartBtn");

let score = 0;
let lives = 3;
let highScore = localStorage.getItem("coinHighScore") || 0;
highScoreText.innerText = "High Score: " + highScore;
let gameOver = false;

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight * 0.7;

function updatePlayerPosition() {
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";
}

// Touch movement
document.addEventListener("touchmove", function(e) {
  let touch = e.touches[0];
  playerX = touch.clientX;
  playerY = touch.clientY;
  updatePlayerPosition();
});

// Mouse movement
document.addEventListener("mousemove", function(e) {
  playerX = e.clientX;
  playerY = e.clientY;
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
    coin.classList.add("powerup", "red"); // slow down
  } else if (rand < 0.18) {
    coin.classList.add("powerup", "heart"); // +1 life
  } else {
    coin.classList.add("coin");
  }

  let x = Math.random() * (window.innerWidth - 40);
  coin.style.left = x + "px";
  coin.style.top = "0px";

  document.body.appendChild(coin);

  let fallSpeed = 2 + Math.random() * 3 + score * 0.05; // difficulty scaling

  function fall() {
    if (gameOver) {
      coin.remove();
      return;
    }

    let coinTop = parseFloat(coin.style.top);
    coin.style.top = coinTop + fallSpeed + "px";

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
        fallSpeed = 1; // slow down effect
      } else if (coin.classList.contains("heart")) {
        lives++;
        livesText.innerText = "Lives: " + lives;
      } else {
        score++;
      }
      scoreText.innerText = "Score: " + score;
      updateLevel();
      coin.remove();
      return;
    }

    // Missed coin
    if (coinTop > window.innerHeight - 40) {
      if (!coin.classList.contains("powerup")) {
        lives--;
        livesText.innerText = "Lives: " + lives;
        if (lives <= 0) {
          endGame();
        }
      }
      coin.remove();
      return;
    }

    requestAnimationFrame(fall);
  }

  fall();
}

// Spawn coins periodically
let coinInterval = setInterval(createCoin, 1000);

function endGame() {
  gameOver = true;
  gameOverText.style.display = "block";
  restartBtn.style.display = "inline-block";
  clearInterval(coinInterval);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("coinHighScore", highScore);
    highScoreText.innerText = "High Score: " + highScore;
  }
}

restartBtn.addEventListener("click", function() {
  score = 0;
  lives = 3;
  scoreText.innerText = "Score: 0";
  livesText.innerText = "Lives: 3";
  gameOver = false;
  gameOverText.style.display = "none";
  restartBtn.style.display = "none";
  coinInterval = setInterval(createCoin, 1000);
