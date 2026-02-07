function getNextMoment() {
  const now = new Date();
  now.setUTCMinutes(now.getUTCMinutes() + 60 - now.getUTCMinutes(), 0, 0);
  return now;
}

let targetTime = getNextMoment();
const countdownEl = document.getElementById("countdown");

function updateCountdown() {
  const now = new Date();
  const diff = Math.floor((targetTime - now) / 1000);

  if (diff <= 0) {
    document.getElementById("modal").classList.remove("hidden");
    clearInterval(timer);
    return;
  }

  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  countdownEl.textContent = `${minutes}m ${seconds}s`;
}

const timer = setInterval(updateCountdown, 1000);

// Join button
const joinBtn = document.getElementById("joinBtn");
const peopleCountEl = document.getElementById("peopleCount");
const gratitudeInput = document.getElementById("gratitudeInput");

joinBtn.addEventListener("click", () => {
  let currentCount = parseInt(peopleCountEl.textContent, 10);
  peopleCountEl.textContent = currentCount + 1;
  joinBtn.textContent = "✔ Joined";
  joinBtn.disabled = true;

  if (gratitudeInput.value.trim() !== "") {
    const msg = document.createElement("div");
    msg.className = "gratitude-msg";
    msg.textContent = "💖 " + gratitudeInput.value;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
  }
});
