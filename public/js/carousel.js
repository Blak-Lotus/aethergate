/**
 * carousel.js
 * Controls the full-screen slide carousel.
 *
 * Supported navigation:
 *   Keyboard  → ArrowLeft / ArrowRight / A / D
 *   Buttons   → #nav-prev / #nav-next
 *   Dots      → .ndot[data-slide]
 *   Touch     → horizontal swipe
 *   Auto      → advances every 9s (pauses on hover/touch)
 */
(function () {
  'use strict';

  const screen  = document.getElementById('carousel-screen');
  const track   = screen.querySelector('.carousel-wrapper');
  const slides  = Array.from(track.querySelectorAll('.slide'));
  const dots    = Array.from(screen.querySelectorAll('.ndot'));
  const prevBtn = document.getElementById('nav-prev');
  const nextBtn = document.getElementById('nav-next');
  const hudCur  = document.getElementById('hud-current');

  let current      = 0;
  let transitioning = false;
  let autoTimer;

  const SLIDE_COUNT = slides.length;
  const DURATION    = 9000; // auto-advance interval ms

  /* ── Activate the initial slide ───────────────── */
  // Set first slide active without animation
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === 0);
  });

  /* ── Core: go to a slide ──────────────────────── */
  function goTo(index, direction) {
    if (transitioning) return;
    if (index === current) return;

    // Clamp / wrap
    index = ((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;

    transitioning = true;

    const outgoing = slides[current];
    const incoming = slides[index];

    /* Outgoing exits to the left */
    outgoing.classList.remove('active');
    outgoing.classList.add('exit-left');

    /* Incoming slides in from the right (default) or left */
    // Reset any previous transform direction
    incoming.style.transition = 'none';
    incoming.style.transform  = direction === 'prev' ? 'translateX(-60px)' : 'translateX(60px)';
    incoming.style.opacity    = '0';

    // Force reflow so the initial state is painted before we animate
    void incoming.offsetWidth;

    incoming.style.transition = '';
    incoming.style.transform  = '';
    incoming.style.opacity    = '';
    incoming.classList.add('active');

    current = index;
    updateUI();

    // Clean up outgoing after transition
    setTimeout(() => {
      outgoing.classList.remove('exit-left');
      outgoing.style.transform = '';
      transitioning = false;
    }, 600);
  }

  function next() { goTo(current + 1, 'next'); }
  function prev() { goTo(current - 1, 'prev'); }

  /* ── Update HUD + dots ────────────────────────── */
  function updateUI() {
    if (hudCur) hudCur.textContent = current + 1;

    dots.forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  /* ── Button listeners ─────────────────────────── */
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); resetAuto(); });

  /* ── Dot listeners ────────────────────────────── */
  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.dataset.slide, 10);
      goTo(idx, idx > current ? 'next' : 'prev');
      resetAuto();
    });
  });

  /* ── Keyboard ─────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    // Only fire when carousel is visible
    if (screen.classList.contains('hidden')) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        next();
        resetAuto();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        prev();
        resetAuto();
        break;
    }
  });

  /* ── Touch swipe ──────────────────────────────── */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved  = false;

  screen.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved  = false;
  }, { passive: true });

  screen.addEventListener('touchmove', () => {
    touchMoved = true;
  }, { passive: true });

  screen.addEventListener('touchend', (e) => {
    if (!touchMoved) return; // tap, not swipe
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      dx < 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });

  /* ── Auto-advance ─────────────────────────────── */
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, DURATION);
  }

  function stopAuto() {
    clearInterval(autoTimer);
  }

  function resetAuto() {
    stopAuto();
    startAuto();
  }

  // Pause on hover
  screen.addEventListener('mouseenter', stopAuto);
  screen.addEventListener('mouseleave', startAuto);
  // Pause on touch
  screen.addEventListener('touchstart', stopAuto, { passive: true });
  screen.addEventListener('touchend',   () => setTimeout(startAuto, 3000), { passive: true });

  /* ── Init ─────────────────────────────────────── */
  updateUI();
  startAuto();

}());