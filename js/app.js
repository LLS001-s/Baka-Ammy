const el = id => document.getElementById(id);
const welcome = el("welcome"), reader = el("reader"), cover = el("bookCover");
const music = el("backgroundMusic");
let index = -1, busy = false;

// Preload and decode every story image before the first page turn.
// This prevents image decoding from interrupting the page animation on phones.
const storyImagesReady = Promise.all(story.map(item => {
  return new Promise(resolve => {
    const preload = new Image();
    preload.src = item.image;
    const finish = () => resolve(true);
    if (preload.complete) {
      if (preload.decode) preload.decode().catch(() => {}).then(finish);
      else finish();
    } else {
      preload.onload = () => {
        if (preload.decode) preload.decode().catch(() => {}).then(finish);
        else finish();
      };
      preload.onerror = finish;
    }
  });
}));

function showSpread(i) {
  const s = story[i];
  el("chapterLabel").textContent = s.chapter;
  el("leftKicker").textContent = s.kicker;
  el("pageTitle").innerHTML = s.title;
  el("leftText").textContent = s.left;
  el("rightText").textContent = s.right;
  el("photoCaption").textContent = s.caption;
  el("handwritten").textContent = s.note;
  const img = el("memoryImage");
  img.loading = "eager";
  img.decoding = "async";
  img.src = s.image;
  img.alt = s.caption;
  img.style.display = "block";
  img.onerror = () => { img.style.display = "none"; el("artFallback").style.display = "grid"; };
  el("artFallback").style.display = "none";
  const n = String(i + 1).padStart(2, "0");
  el("leftPageNo").textContent = String(i * 2 + 1).padStart(2, "0");
  el("rightPageNo").textContent = String(i * 2 + 2).padStart(2, "0");
  el("progressText").textContent = `CHAPTER ${n} / 06`;
  el("progressBar").style.width = `${((i + 1) / story.length) * 100}%`;
  el("previousButton").disabled = i === 0;
  el("nextButton").textContent = i === story.length - 1 ? "Birthday wish ♡" : "Next page →";
}
function startStory() {
  welcome.classList.add("hide");
  reader.classList.add("show");
  reader.setAttribute("aria-hidden", "false");
  window.setTimeout(() => cover.classList.add("open"), 120);
  index = 0;
  showSpread(index);
}
function turn(direction) {
  if (busy || index < 0) return;
  if (direction > 0 && index === story.length - 1) {
    el("birthdayModal").classList.add("show");
    el("birthdayModal").setAttribute("aria-hidden", "false");
    return;
  }
  const next = Math.max(0, Math.min(story.length - 1, index + direction));
  if (next === index) return;
  busy = true;
  const sheet = el("pageTurn");
  el("turnNumber").textContent = String((index + 1) * 2 + 2).padStart(2, "0");
  sheet.classList.remove("turning");
  void sheet.offsetWidth;
  sheet.classList.add("turning");
  // Wait until the next image is decoded, but never block the animation start.
  storyImagesReady.then(() => {
    window.setTimeout(() => { index = next; showSpread(index); }, 780);
  });
  window.setTimeout(() => { sheet.classList.remove("turning"); busy = false; }, 850);
}
el("beginButton").addEventListener("click", startStory);
el("coverOpen").addEventListener("click", startStory);
el("nextButton").addEventListener("click", () => turn(1));
el("previousButton").addEventListener("click", () => turn(-1));
el("modalClose").addEventListener("click", () => {
  el("birthdayModal").classList.remove("show");
  el("birthdayModal").setAttribute("aria-hidden", "true");
});
el("birthdayModal").addEventListener("click", e => { if (e.target === el("birthdayModal")) el("modalClose").click(); });
el("birthdayLetterOpen").addEventListener("click", () => {
  el("birthdayLetterModal").classList.add("show");
  el("birthdayLetterModal").setAttribute("aria-hidden", "false");
});
el("birthdayLetterClose").addEventListener("click", () => {
  el("birthdayLetterModal").classList.remove("show");
  el("birthdayLetterModal").setAttribute("aria-hidden", "true");
});
el("birthdayLetterModal").addEventListener("click", e => { if (e.target === el("birthdayLetterModal")) el("birthdayLetterClose").click(); });
el("letterOpen").addEventListener("click", () => {
  el("letterModal").classList.add("show");
  el("letterModal").setAttribute("aria-hidden", "false");
});
el("letterClose").addEventListener("click", () => {
  el("letterModal").classList.remove("show");
  el("letterModal").setAttribute("aria-hidden", "true");
});
el("letterModal").addEventListener("click", e => { if (e.target === el("letterModal")) el("letterClose").click(); });
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") turn(1);
  if (e.key === "ArrowLeft") turn(-1);
  if (e.key === "Escape") { el("modalClose").click(); el("letterClose").click(); el("birthdayLetterClose").click(); }
});
el("musicButton").addEventListener("click", async () => {
  const label = el("musicLabel");
  if (music.paused) {
    try { await music.play(); label.textContent = "Music on"; }
    catch { label.textContent = "Add backgroundMusic.mp3"; }
  } else { music.pause(); label.textContent = "Music off"; }
});
music.addEventListener("ended", () => {
  music.currentTime = 0;
  music.play().catch(() => {});
});

// Password gate + background music that starts by default
const gate = el("gate");
const gateInput = el("gateInput");
const gateHint = el("gateHint");
const SECRET_PASSWORD = "bakaammy";
const gateHintText = gateHint.textContent;

function playMusic() {
  try { music.volume = 0.6; } catch (e) {}
  const started = music.play();
  if (started && started.then) {
    started
      .then(() => { el("musicLabel").textContent = "Music on"; })
      .catch(() => { el("musicLabel").textContent = "Music off"; });
  } else {
    el("musicLabel").textContent = "Music on";
  }
}

function unlockGate() {
  gate.classList.add("hide");
  gate.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
  playMusic();
}

function submitPassword() {
  const value = (gateInput.value || "").trim().toLowerCase();
  if (value === SECRET_PASSWORD) {
    unlockGate();
    return;
  }
  gateHint.textContent = "Hmm, that's not quite it. Try again ♡";
  gateHint.classList.add("error");
  gate.classList.remove("shake");
  void gate.offsetWidth;
  gate.classList.add("shake");
  gateInput.select();
}

el("gateEnter").addEventListener("click", submitPassword);
gateInput.addEventListener("keydown", e => { if (e.key === "Enter") submitPassword(); });
gateInput.addEventListener("input", () => {
  if (gateHint.classList.contains("error")) {
    gateHint.classList.remove("error");
    gateHint.textContent = gateHintText;
  }
});

// Browsers may block sound until the visitor interacts with the page, so we
// also try on load and rely on the password button as the first interaction.
window.addEventListener("load", playMusic);