/* ============================================================
   THE BOT CLUB — script.js
   Particle canvas · Scroll effects · Nav · Form handling
   ============================================================ */

/* ── Utility: debounce ──────────────────────────────────────── */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ── Particle Canvas ────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const COLORS  = ['#22d3ee', '#3b82f6', '#8b5cf6'];
  const COUNT   = window.innerWidth < 768 ? 35 : 70;
  const MAX_DIST = 130;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() { this.reset(); }
  Particle.prototype.reset = function () {
    this.x     = Math.random() * W;
    this.y     = Math.random() * H;
    this.vx    = (Math.random() - 0.5) * 0.35;
    this.vy    = (Math.random() - 0.5) * 0.35;
    this.r     = Math.random() * 1.5 + 0.5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = Math.random() * 0.5 + 0.2;
  };
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };
  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(this.color, this.alpha);
    ctx.fill();
  };

  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(tick);
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
    if (animId) cancelAnimationFrame(animId);
    tick();
  }

  // Debounced resize — avoids thrashing on every pixel change
  window.addEventListener('resize', debounce(() => {
    resize();
    particles.forEach(p => p.reset());
  }, 150));

  // Pause particles when tab is hidden (saves CPU/battery)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animId) cancelAnimationFrame(animId);
    } else {
      tick();
    }
  });

  init();
})();

/* ── Navigation ─────────────────────────────────────────────── */
(function initNav() {
  const nav       = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile-panel');

  // Scroll: add .scrolled class
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
      mobileNav.classList.toggle('open', open);
      mobileNav.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click, Escape key
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && hamburger.classList.contains('open')) closeMenu();
    });
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburger.focus();
  }
})();

/* ── Smooth Scroll for anchor links ─────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    // Move focus to target section for keyboard/screen-reader users
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

/* ── Scroll-reveal with IntersectionObserver ─────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

/* ── Form validation helpers ─────────────────────────────────── */
function setFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(id + '-error');
  if (!input || !error) return;
  error.textContent = message;
  input.classList.toggle('field-error', !!message);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function clearFieldError(id) {
  setFieldError(id, '');
}

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function validateForm(data) {
  let valid = true;

  if (!data.get('company')?.trim()) {
    setFieldError('company', 'Please enter your company or project name.');
    valid = false;
  } else {
    clearFieldError('company');
  }

  if (!data.get('name')?.trim()) {
    setFieldError('name', 'Please enter your name.');
    valid = false;
  } else {
    clearFieldError('name');
  }

  const email = data.get('email') || '';
  if (!email.trim()) {
    setFieldError('email', 'Please enter your email address.');
    valid = false;
  } else if (!validateEmail(email)) {
    setFieldError('email', 'Please enter a valid email address.');
    valid = false;
  } else {
    clearFieldError('email');
  }

  if (!data.get('stage')) {
    setFieldError('stage', 'Please select your current stage.');
    valid = false;
  } else {
    clearFieldError('stage');
  }

  if (!data.get('about')?.trim()) {
    setFieldError('about', 'Please tell us a bit about your vision.');
    valid = false;
  } else {
    clearFieldError('about');
  }

  return valid;
}

/* ── Application Form ───────────────────────────────────────── */
(function initForm() {
  const form    = document.getElementById('apply-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.id) clearFieldError(field.id);
    });
    field.addEventListener('change', () => {
      if (field.id) clearFieldError(field.id);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    // Client-side validation first
    if (!validateForm(data)) {
      // Focus the first error field
      const firstError = form.querySelector('.field-error');
      if (firstError) firstError.focus();
      return;
    }

    const btn  = form.querySelector('.btn-submit');
    const orig = btn.innerHTML;
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"
           aria-hidden="true" style="animation:spin .8s linear infinite;transform-origin:center">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      Sending…`;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');

    try {
      // Compose mailto as the primary submission method
      const subject = encodeURIComponent('Application — ' + (data.get('company') || 'Unknown Company'));
      const body = encodeURIComponent(
        `Company: ${data.get('company') || ''}\n` +
        `Contact: ${data.get('name') || ''}\n` +
        `Email: ${data.get('email') || ''}\n` +
        `Stage: ${data.get('stage') || ''}\n\n` +
        `About:\n${data.get('about') || ''}\n\n` +
        `Support needed:\n${data.getAll('support').join(', ') || 'Not specified'}`
      );
      window.location.href = `mailto:hello@thebot.club?subject=${subject}&body=${body}`;

      // Show success state after short delay
      await new Promise(r => setTimeout(r, 600));

      form.style.display = 'none';
      if (success) success.classList.add('visible');

    } catch (err) {
      btn.innerHTML = orig;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      // Non-intrusive error — show inline rather than alert()
      const note = form.querySelector('.form-note');
      if (note) {
        note.textContent = 'Something went wrong. Please email us directly at hello@thebot.club';
        note.style.color = '#f87171';
      }
    }
  });
})();

/* ── Hero entrance animation stagger ────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  // Skip animation if reduced motion preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const heroEls = document.querySelectorAll('.hero-animate');
  heroEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
});
