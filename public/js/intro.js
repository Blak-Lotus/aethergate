/**
 * intro.js
 * - Draws animated star field on #stars-canvas (z-index 1, underlay)
 * - #intro-center is already above it via z-index:10 in CSS
 * - Detects ?arcade URL param → skips intro, jumps straight to carousel
 * - Any keydown / click / touch triggers the intro-exit transition
 */
(function () {
  'use strict';

  const introScreen  = document.getElementById('intro-screen');
  const carouselScreen = document.getElementById('carousel-screen');
  const canvas       = document.getElementById('stars-canvas');
  const ctx          = canvas.getContext('2d');

  let launched = false;
  let raf;

  /* ── Skip intro if returning from a game page ── */
  if (new URLSearchParams(window.location.search).has('arcade')) {
    introScreen.style.display = 'none';
    carouselScreen.classList.remove('hidden');
    // Make sure carousel.js initialises after we show it
    return; // exit intro script entirely
  }

  /* ── Resize canvas to match viewport ─────────── */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ── Star objects ─────────────────────────────── */
  const STAR_COUNT = 220;
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.4 + 0.15,
        alpha: Math.random() * 0.8 + 0.1,
        drift: (Math.random() - 0.5) * 0.25,
        speed: Math.random() * 0.35 + 0.04,
      });
    }
  }

  /* ── Draw frame ───────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.fillStyle   = '#b8ccff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Twinkle
      s.alpha += (Math.random() - 0.5) * 0.025;
      s.alpha  = Math.max(0.05, Math.min(0.95, s.alpha));

      // Slow drift upward
      s.y -= s.speed;
      s.x += s.drift;

      // Wrap
      if (s.y < -2)                 { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }
      if (s.x < -2)                 { s.x = canvas.width + 2; }
      if (s.x > canvas.width + 2)   { s.x = -2; }
    }

    raf = requestAnimationFrame(draw);
  }

  /* ── Initialise ───────────────────────────────── */
  resize();
  initStars();
  draw();
  window.addEventListener('resize', () => { resize(); initStars(); });

  /* ── Launch transition ────────────────────────── */
  function launch() {
    if (launched) return;
    launched = true;

    cancelAnimationFrame(raf);

    introScreen.classList.add('exiting');

    setTimeout(() => {
      introScreen.style.display = 'none';
      carouselScreen.classList.remove('hidden');
    }, 820);
  }

  /* Input listeners — all three input methods */
  window.addEventListener('keydown',    () => launch());
  introScreen.addEventListener('click', () => launch());
  introScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    launch();
  }, { passive: false });

}());