/* =============================================
   script.js — Qamar Apology Website Logic
   ============================================= */

'use strict';

// ============================================================
// STATE
// ============================================================
let currentSlide = 0;
const TOTAL_SLIDES = 7;
let isAnimating = false;
let musicPlaying = false;
let audioCtx = null;
let introTypingDone = false;
let heartInterval = null;

// ============================================================
// TYPING EFFECT — Intro
// ============================================================
function typeText(element, text, speed = 120) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        introTypingDone = true;
        resolve();
      }
    }, speed);
  });
}

// ============================================================
// INIT — On page load
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  spawnIntroHearts();
  buildDots();
  updateProgress();
  updateNavButtons();

  const introTextEl = document.getElementById('intro-text');

  // Wait 0.8s then start typing
  await delay(800);
  await typeText(introTextEl, 'والله اسف', 160);

  // Show start button hint glow
  await delay(600);
  const startBtn = document.getElementById('start-btn');
  startBtn.style.animation = 'fadeInUp 1s ease forwards, glowPulse 2s ease-in-out 1s infinite';
});

// ============================================================
// TRANSITION — Intro → Slideshow
// ============================================================
function startSlideshow() {
  const intro = document.getElementById('intro-screen');
  const slideshow = document.getElementById('slideshow-section');

  intro.classList.add('fade-out');
  slideshow.classList.remove('hidden');

  setTimeout(() => {
    slideshow.classList.add('visible');
    intro.style.display = 'none';
    stopIntroHearts();
    enterSlide(0);
  }, 800);
}

// ============================================================
// SLIDE NAVIGATION
// ============================================================
function changeSlide(direction) {
  if (isAnimating) return;
  const newIndex = currentSlide + direction;
  if (newIndex < 0 || newIndex >= TOTAL_SLIDES) return;
  goToSlide(newIndex, direction);
}

function goToSlide(newIndex, direction) {
  if (isAnimating || newIndex === currentSlide) return;
  isAnimating = true;

  const slides = document.querySelectorAll('.slide');
  const current = slides[currentSlide];
  const next    = slides[newIndex];

  // Determine exit direction
  const exitClass  = direction >= 0 ? 'exit-left' : 'exit-right-custom';
  const enterStart = direction >= 0 ? 'enter-right' : 'enter-left-custom';

  // Add enter start position
  next.classList.add(enterStart);
  next.style.transform = direction >= 0 ? 'translateX(80px) scale(0.94)' : 'translateX(-80px) scale(0.94)';
  next.style.opacity = '0';
  next.style.pointerEvents = 'none';

  // Force reflow
  void next.offsetHeight;

  // Exit current
  current.classList.remove('active');
  current.style.transform = direction >= 0 ? 'translateX(-80px) scale(0.94)' : 'translateX(80px) scale(0.94)';
  current.style.opacity = '0';

  // Enter next
  next.style.transform = '';
  next.style.opacity = '';
  next.classList.remove(enterStart);
  next.classList.add('active');

  currentSlide = newIndex;
  updateProgress();
  updateNavButtons();
  updateDots();
  updateCounter();

  // If final slide, trigger hearts
  if (currentSlide === TOTAL_SLIDES - 1) {
    triggerHeartsExplosion();
  }

  setTimeout(() => {
    current.style.transform = '';
    current.style.opacity   = '';
    isAnimating = false;
  }, 750);
}

function enterSlide(index) {
  const slides = document.querySelectorAll('.slide');
  slides.forEach((s, i) => {
    s.classList.remove('active');
    s.style.opacity   = '';
    s.style.transform = '';
  });
  slides[index].classList.add('active');
  updateProgress();
  updateDots();
  updateCounter();
}

// ============================================================
// UI UPDATES
// ============================================================
function updateProgress() {
  const pct = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function updateNavButtons() {
  document.getElementById('prev-btn').disabled = currentSlide === 0;
  document.getElementById('next-btn').disabled = currentSlide === TOTAL_SLIDES - 1;
}

function updateCounter() {
  document.getElementById('current-slide-num').textContent = currentSlide + 1;
  document.getElementById('total-slides-num').textContent  = TOTAL_SLIDES;
}

function buildDots() {
  const container = document.getElementById('slide-dots');
  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'انتقال للشريحة ' + (i + 1));
    dot.id = 'dot-' + i;
    dot.addEventListener('click', () => {
      if (!isAnimating && i !== currentSlide) {
        goToSlide(i, i > currentSlide ? 1 : -1);
      }
    });
    container.appendChild(dot);
  }
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// ============================================================
// KEYBOARD NAVIGATION
// ============================================================
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('slideshow-section').classList.contains('visible')) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    // RTL: arrow-right = prev, arrow-left = next
    if (e.key === 'ArrowLeft')  changeSlide(1);
    if (e.key === 'ArrowRight') changeSlide(-1);
  }
});

// ============================================================
// TOUCH / SWIPE
// ============================================================
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!document.getElementById('slideshow-section').classList.contains('visible')) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    // RTL swipe: swipe-left = next, swipe-right = prev
    if (dx < 0) changeSlide(1);
    else         changeSlide(-1);
  }
}, { passive: true });

// ============================================================
// FORGIVE BUTTON
// ============================================================
function handleForgive(yes) {
  if (yes) {
    document.getElementById('forgive-yes').style.display = 'none';
    document.getElementById('forgive-no').style.display  = 'none';
    const msg = document.getElementById('forgiven-msg');
    msg.classList.remove('hidden');
    triggerCelebration();
  }
}

// Runaway "No" button
function runAway(btn) {
  const maxX = window.innerWidth  - 120;
  const maxY = window.innerHeight - 80;
  const rx = Math.floor(Math.random() * maxX);
  const ry = Math.floor(Math.random() * maxY);
  btn.style.position = 'fixed';
  btn.style.left = rx + 'px';
  btn.style.top  = ry + 'px';
  btn.style.zIndex = 999;
}

// ============================================================
// PARTICLES CANVAS
// ============================================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 60 }, () => createParticle(canvas));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += Math.sin(p.angle) * 0.5;
      p.angle += 0.02;
      p.opacity -= 0.0008;

      if (p.y < -20 || p.opacity <= 0) {
        Object.assign(p, createParticle(canvas, true));
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle   = p.color;
      ctx.font        = p.size + 'px serif';
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

function createParticle(canvas, reset = false) {
  const chars  = ['♥', '✿', '★', '✦', '◆', '•', '♡', '✩'];
  const colors = ['#f8a5c2', '#c39bd3', '#f9ca24', '#ff6b9d', '#ffb3c6', '#fff', '#9b59b6'];
  return {
    x:       Math.random() * canvas.width,
    y:       reset ? canvas.height + 10 : Math.random() * canvas.height,
    speed:   0.3 + Math.random() * 0.8,
    angle:   Math.random() * Math.PI * 2,
    opacity: 0.15 + Math.random() * 0.4,
    size:    10 + Math.random() * 16,
    char:    chars[Math.floor(Math.random() * chars.length)],
    color:   colors[Math.floor(Math.random() * colors.length)],
  };
}

// ============================================================
// FLOATING HEARTS — Intro
// ============================================================
function spawnIntroHearts() {
  const container = document.getElementById('floating-hearts-intro');
  const emojis    = ['💕', '💖', '💗', '🌸', '✨', '💞', '🌹', '💝'];

  heartInterval = setInterval(() => {
    const heart  = document.createElement('span');
    heart.className = 'heart-particle';
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left    = Math.random() * 100 + 'vw';
    heart.style.bottom  = '0';
    heart.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    const dur = 4 + Math.random() * 4;
    heart.style.animationDuration  = dur + 's';
    heart.style.animationDelay     = '0s';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), dur * 1000);
  }, 350);
}

function stopIntroHearts() {
  clearInterval(heartInterval);
}

// ============================================================
// HEARTS EXPLOSION — Final Slide
// ============================================================
function triggerHeartsExplosion() {
  const container = document.getElementById('hearts-explosion');
  container.innerHTML = '';
  const emojis = ['❤️', '💕', '💖', '💗', '💝', '💞', '🌹', '✨'];
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const h = document.createElement('span');
      h.className = 'heart-particle';
      h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      h.style.left   = Math.random() * 100 + '%';
      h.style.bottom = '0';
      h.style.fontSize = (1.2 + Math.random() * 2) + 'rem';
      const dur = 3 + Math.random() * 3;
      h.style.animationDuration = dur + 's';
      container.appendChild(h);
      setTimeout(() => h.remove(), dur * 1000 + 200);
    }, i * 80);
  }
}

// ============================================================
// CELEBRATION — After forgive
// ============================================================
function triggerCelebration() {
  const emojis = ['🎉', '🎊', '💖', '✨', '🌟', '🎈', '💕', '🥳'];
  const body   = document.body;
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'heart-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left     = Math.random() * 100 + 'vw';
      el.style.bottom   = '0';
      el.style.fontSize = (1.5 + Math.random() * 2) + 'rem';
      el.style.zIndex   = '9999';
      const dur = 3 + Math.random() * 3;
      el.style.animationDuration = dur + 's';
      body.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 200);
    }, i * 60);
  }
}

// ============================================================
// WEB AUDIO — Generative Romantic Music
// ============================================================
function toggleMusic() {
  const btn = document.getElementById('music-btn');

  if (!musicPlaying) {
    startGenerativeMusic();
    btn.classList.add('playing');
    btn.textContent = '🎶';
    musicPlaying = true;
  } else {
    stopGenerativeMusic();
    btn.classList.remove('playing');
    btn.textContent = '🎵';
    musicPlaying = false;
  }
}

let musicNodes = [];
let musicScheduler = null;

function startGenerativeMusic() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 2);
  masterGain.connect(audioCtx.destination);

  // Romantic chord progression in A minor
  const notes = [
    // Am  F   C   G
    [220, 261.63, 329.63, 392],
    [174.61, 220, 261.63, 349.23],
    [130.81, 164.81, 196, 261.63],
    [196, 246.94, 293.66, 392],
  ];

  let chordIdx  = 0;
  let noteQueue = [];

  function playChord() {
    const chord = notes[chordIdx % notes.length];
    chord.forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = ['sine', 'sine', 'triangle', 'triangle'][i % 2];
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 - i * 0.01, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 4);
      noteQueue.push(osc, gain);
    });

    chordIdx++;
    musicScheduler = setTimeout(playChord, 3800);
  }

  // Add a gentle melody on top
  const melodyNotes = [440, 493.88, 523.25, 587.33, 523.25, 493.88, 440, 392];
  let mIdx = 0;

  function playMelody() {
    const freq  = melodyNotes[mIdx % melodyNotes.length];
    const osc   = audioCtx.createOscillator();
    const gain  = audioCtx.createGain();
    const now   = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 1);

    mIdx++;
    noteQueue.push(osc, gain);
  }

  playChord();
  const melodyTimer = setInterval(playMelody, 480);
  noteQueue.push({ stop: () => clearInterval(melodyTimer) });
  musicNodes = [...noteQueue, masterGain, { stopAll: () => { clearTimeout(musicScheduler); clearInterval(melodyTimer); } }];
}

function stopGenerativeMusic() {
  clearTimeout(musicScheduler);
  if (audioCtx) {
    try { audioCtx.close(); } catch(e) {}
    audioCtx = null;
  }
  musicNodes = [];
  musicPlaying = false;
}

// ============================================================
// UTILITY
// ============================================================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// CLICK on intro screen to start
// ============================================================
document.getElementById('intro-screen').addEventListener('click', () => {
  if (introTypingDone) startSlideshow();
});
