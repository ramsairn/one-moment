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
const touchLayer = document.getElementById("touchLayer");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownNum = document.getElementById("countdownNum");
const pauseBtn = document.getElementById("pauseBtn");
const comboDisplay = document.getElementById("comboDisplay");
const floatContainer = document.getElementById("floatContainer");
const particleContainer = document.getElementById("particleContainer");
const gameOverStatsEl = document.getElementById("gameOverStats");
const newRecordBanner = document.getElementById("newRecordBanner");

// --- Game state ---
let score = 0;
let lives = 3;
let highScore = parseInt(localStorage.getItem("coinHighScore") || "0", 10);
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let coinInterval = null;
let slowModeUntil = 0;
let coinsCollectedThisGame = 0;
let maxComboThisGame = 0;
let comboCount = 0;

// Player: target position (where finger/cursor is) and current (smooth follow)
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight * 0.7;
let playerTargetX = playerX;
let playerTargetY = playerY;
const LERP = 0.18;

const COIN_SIZE = 40;
const HITBOX_PAD = 12;
const isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Use visualViewport on mobile for correct dimensions (address bar, keyboard)
function getViewport() {
  const v = window.visualViewport;
  return v ? { w: v.width, h: v.height } : { w: window.innerWidth, h: window.innerHeight };
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function showCollectFeedback(x, y, points, isComboBonus) {
  if (floatContainer) {
    const el = document.createElement("span");
    el.className = "float-text" + (isComboBonus ? " bonus" : "");
    el.textContent = (points > 0 ? "+" : "") + points;
    el.style.left = (x - 20) + "px";
    el.style.top = y + "px";
    floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }
  if (particleContainer) {
    const color = isComboBonus ? "#00ffcc" : "#ffd700";
    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const angle = (i / 8) * Math.PI * 2 + Math.random();
      const dist = 30 + Math.random() * 40;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = color;
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      particleContainer.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }
  document.body.classList.remove("collect-flash");
  void document.body.offsetHeight;
  document.body.classList.add("collect-flash");
  setTimeout(() => document.body.classList.remove("collect-flash"), 160);
  vibrate(30);
}

function updateComboDisplay() {
  if (!comboDisplay) return;
  if (comboCount >= 3) {
    comboDisplay.textContent = comboCount + " combo! +" + Math.min(comboCount, 5) + " bonus";
    comboDisplay.classList.add("visible");
    maxComboThisGame = Math.max(maxComboThisGame, comboCount);
  } else {
    comboDisplay.classList.remove("visible");
  }
}

// --- Init display ---
highScoreText.innerText = "High Score: " + highScore;

function updatePlayerPosition() {
  if (!player) return;
  const half = player.offsetWidth / 2;
  player.style.left = (playerX - half) + "px";
  player.style.top = (playerY - half) + "px";
}

function isPlaying() {
  return gameStarted && !gameOver && !gamePaused;
}

function setPositionFromEvent(clientX, clientY) {
  const vp = getViewport();
  const half = player ? player.offsetWidth / 2 : 36;
  playerTargetX = Math.max(half, Math.min(vp.w - half, clientX));
  playerTargetY = Math.max(half, Math.min(vp.h - half, clientY));
}

function tickPlayer() {
  if (!gameStarted || gameOver || !player) return;
  const half = player.offsetWidth / 2;
  playerX += (playerTargetX - playerX) * LERP;
  playerY += (playerTargetY - playerY) * LERP;
  playerX = Math.max(half, Math.min(getViewport().w - half, playerX));
  playerY = Math.max(half, Math.min(getViewport().h - half, playerY));
  updatePlayerPosition();
  requestAnimationFrame(tickPlayer);
}
requestAnimationFrame(tickPlayer);

// --- Mouse: only when game is active ---
document.addEventListener("mousemove", function (e) {
  if (!isPlaying()) return;
  setPositionFromEvent(e.clientX, e.clientY);
});

// --- Touch: use touchLayer when playing so nothing scrolls/zooms; touchstart + touchmove ---
if (touchLayer) {
  touchLayer.addEventListener("touchstart", function (e) {
    if (!isPlaying()) return;
    e.preventDefault();
    const t = e.touches[0];
    if (t) setPositionFromEvent(t.clientX, t.clientY);
  }, { passive: false });

  touchLayer.addEventListener("touchmove", function (e) {
    if (!isPlaying()) return;
    e.preventDefault();
    const t = e.touches[0];
    if (t) setPositionFromEvent(t.clientX, t.clientY);
  }, { passive: false });
}

// Fallback: body touch (in case touchLayer is missing)
document.addEventListener("touchmove", function (e) {
  if (!isPlaying()) return;
  if (e.target.closest("#startScreen, #gameOverScreen")) return;
  e.preventDefault();
  const t = e.touches[0];
  if (t) setPositionFromEvent(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener("touchstart", function (e) {
  if (!isPlaying()) return;
  if (e.target.closest("#startScreen, #gameOverScreen")) return;
  const t = e.touches[0];
  if (t) setPositionFromEvent(t.clientX, t.clientY);
}, { passive: true });

// --- Start game ---
function startGame() {
  gameOver = false;
  gameStarted = true;
  gamePaused = false;
  score = 0;
  lives = 3;
  slowModeUntil = 0;
  coinsCollectedThisGame = 0;
  maxComboThisGame = 0;
  comboCount = 0;

  startScreen.style.display = "none";
  hud.classList.add("visible");
  player.classList.add("visible");
  gameOverScreen.classList.remove("visible");
  if (countdownOverlay) countdownOverlay.classList.add("visible");
  if (comboDisplay) comboDisplay.classList.remove("visible");

  scoreText.innerText = "Score: " + score;
  livesText.innerText = "Lives: " + lives;
  highScoreText.innerText = "High Score: " + highScore;

  document.body.classList.add("playing");
  if (touchLayer) touchLayer.classList.add("active");
  const vp = getViewport();
  playerX = playerTargetX = vp.w / 2;
  playerY = playerTargetY = vp.h * 0.7;
  updatePlayerPosition();

  document.querySelectorAll(".coin, .powerup").forEach((el) => el.remove());
  if (floatContainer) floatContainer.innerHTML = "";
  if (particleContainer) particleContainer.innerHTML = "";

  if (coinInterval) clearInterval(coinInterval);
  coinInterval = null;

  function countdownStep(n) {
    if (!countdownNum) return;
    if (n > 0) {
      countdownNum.textContent = n;
      countdownNum.style.animation = "none";
      void countdownNum.offsetHeight;
      countdownNum.style.animation = "countdownPulse 0.8s ease-out";
      setTimeout(() => countdownStep(n - 1), 900);
    } else {
      countdownNum.textContent = "Go!";
      countdownNum.style.animation = "none";
      void countdownNum.offsetHeight;
      countdownNum.style.animation = "countdownPulse 0.5s ease-out";
      setTimeout(() => {
        if (countdownOverlay) countdownOverlay.classList.remove("visible");
        if (coinInterval) clearInterval(coinInterval);
        coinInterval = setInterval(createCoin, 900);
      }, 500);
    }
  }
  countdownStep(3);
}

// --- End game ---
function endGame() {
  gameOver = true;
  if (coinInterval) {
    clearInterval(coinInterval);
    coinInterval = null;
  }
  document.querySelectorAll(".coin, .powerup").forEach((el) => el.remove());

  const wasNewRecord = score > highScore;
  if (wasNewRecord) {
    highScore = score;
    localStorage.setItem("coinHighScore", highScore);
    highScoreText.innerText = "High Score: " + highScore;
  }

  finalScoreText.innerText = "Score: " + score + " | High Score: " + highScore;
  if (gameOverStatsEl) {
    gameOverStatsEl.innerHTML = "Coins collected: " + coinsCollectedThisGame + "<br>Best combo: " + maxComboThisGame;
  }
  if (newRecordBanner) {
    newRecordBanner.classList.toggle("visible", wasNewRecord);
  }
  gameOverScreen.classList.add("visible");
  document.body.classList.remove("playing");
  if (touchLayer) touchLayer.classList.remove("active");
}

// --- Restart (button) ---
function handleStart() {
  startGame();
}

restartBtn.addEventListener("click", handleStart);
startBtn.addEventListener("click", handleStart);
// Mobile: start on touch so no 300ms click delay
startBtn.addEventListener("touchend", function (e) {
  e.preventDefault();
  handleStart();
}, { passive: false });
restartBtn.addEventListener("touchend", function (e) {
  e.preventDefault();
  handleStart();
}, { passive: false });

if (pauseBtn) {
  pauseBtn.addEventListener("click", function () {
    if (!gameStarted || gameOver) return;
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? "▶" : "⏸";
    if (gamePaused) {
      if (coinInterval) { clearInterval(coinInterval); coinInterval = null; }
    } else {
      if (!coinInterval) coinInterval = setInterval(createCoin, 900);
    }
  });
  pauseBtn.addEventListener("touchend", function (e) { e.preventDefault(); pauseBtn.click(); }, { passive: false });
}

// Keep player in bounds on resize / orientation change / mobile address bar
window.addEventListener("resize", function () {
  if (!gameStarted || gameOver) return;
  const vp = getViewport();
  const half = player ? player.offsetWidth / 2 : 36;
  playerX = Math.max(half, Math.min(vp.w - half, playerX));
  playerY = Math.max(half, Math.min(vp.h - half, playerY));
  playerTargetX = Math.max(half, Math.min(vp.w - half, playerTargetX));
  playerTargetY = Math.max(half, Math.min(vp.h - half, playerTargetY));
  updatePlayerPosition();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", function () {
    if (!gameStarted || gameOver) return;
    const vp = getViewport();
    const half = player ? player.offsetWidth / 2 : 36;
    playerX = Math.max(half, Math.min(vp.w - half, playerX));
    playerY = Math.max(half, Math.min(vp.h - half, playerY));
    playerTargetX = Math.max(half, Math.min(vp.w - half, playerTargetX));
    playerTargetY = Math.max(half, Math.min(vp.h - half, playerTargetY));
    updatePlayerPosition();
  });
}

// --- Spawn coins / powerups ---
function createCoin() {
  if (gameOver || !gameStarted || gamePaused) return;

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

  const vp = getViewport();
  const x = Math.random() * (vp.w - COIN_SIZE);
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
    let playerRect = player.getBoundingClientRect();
    if (isTouchDevice()) {
      playerRect = {
        left: playerRect.left - HITBOX_PAD,
        right: playerRect.right + HITBOX_PAD,
        top: playerRect.top - HITBOX_PAD,
        bottom: playerRect.bottom + HITBOX_PAD
      };
    }

    // Collision
    if (
      coinRect.left < playerRect.right &&
      coinRect.right > playerRect.left &&
      coinRect.top < playerRect.bottom &&
      coinRect.bottom > playerRect.top
    ) {
      const cx = (coinRect.left + coinRect.right) / 2;
      const cy = (coinRect.top + coinRect.bottom) / 2;
      let points = 0;
      let isCoin = false;

      if (coin.classList.contains("blue")) {
        points = 5;
        score += 5;
      } else if (coin.classList.contains("red")) {
        slowModeUntil = Date.now() + 3000;
        points = 0;
        vibrate(20);
      } else if (coin.classList.contains("heart")) {
        lives++;
        livesText.innerText = "Lives: " + lives;
        points = 0;
        vibrate(25);
      } else {
        isCoin = true;
        coinsCollectedThisGame++;
        comboCount++;
        const bonus = comboCount >= 3 ? Math.min(comboCount, 5) : 0;
        points = 1 + bonus;
        score += points;
        updateComboDisplay();
      }

      if (!isCoin) {
        comboCount = 0;
        if (comboDisplay) comboDisplay.classList.remove("visible");
      }
      if (points > 0) showCollectFeedback(cx, cy, points, comboCount >= 3 && isCoin);

      scoreText.innerText = "Score: " + score;
      if (score > highScore) {
        highScore = score;
        highScoreText.innerText = "High Score: " + highScore;
      }
      coin.remove();
      return;
    }

    // Missed: below screen
    const vp = getViewport();
    if (coinTop > vp.h - COIN_SIZE) {
      if (!coin.classList.contains("powerup")) {
        comboCount = 0;
        if (comboDisplay) comboDisplay.classList.remove("visible");
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
