// ===== Loader =====
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 500);
});

// ===== Mobile index overlay =====
const indexToggle = document.getElementById('indexToggle');
const indexOverlay = document.getElementById('indexOverlay');
indexToggle.addEventListener('click', () => {
  const open = indexOverlay.classList.toggle('open');
  indexToggle.setAttribute('aria-expanded', String(open));
});
indexOverlay.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    indexOverlay.classList.remove('open');
    indexToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===== Active rail link on scroll =====
const sections = document.querySelectorAll('main section[id]');
const railLinks = document.querySelectorAll('.rail-link');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      railLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.rail-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

// ===== Reveal on scroll =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), (i % 6) * 90);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ===== Menu dossier accordion =====
const dossierItems = document.querySelectorAll('.dossier-item');
function setDossierHeight(item, open) {
  const body = item.querySelector('.dossier-body');
  const head = item.querySelector('.dossier-head');
  if (open) {
    item.classList.add('open');
    head.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = body.scrollHeight + 40 + 'px';
  } else {
    item.classList.remove('open');
    head.setAttribute('aria-expanded', 'false');
    body.style.maxHeight = '0px';
  }
}
dossierItems.forEach((item, i) => {
  item.querySelector('.dossier-head').addEventListener('click', () => {
    const willOpen = !item.classList.contains('open');
    dossierItems.forEach(other => setDossierHeight(other, false));
    if (willOpen) setDossierHeight(item, true);
  });
  if (i === 0) setDossierHeight(item, true);
});
window.addEventListener('resize', () => {
  dossierItems.forEach(item => {
    if (item.classList.contains('open')) setDossierHeight(item, true);
  });
});

// ===== Seal stamp effect =====
const stampEls = document.querySelectorAll('.seal-stamp');
const stampObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('stamped');
      stampObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
stampEls.forEach(el => stampObserver.observe(el));

// ===== Animated stat counters =====
function animateCount(el) {
  const to = parseFloat(el.dataset.countTo);
  const from = parseFloat(el.dataset.countFrom || '0');
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (to - from) * eased;
    el.textContent = decimals ? value.toFixed(decimals) : Math.round(value);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = decimals ? to.toFixed(decimals) : to;
  }
  requestAnimationFrame(step);
}
const countEls = document.querySelectorAll('[data-count-to]');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
countEls.forEach(el => countObserver.observe(el));

// ===== Footer year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== PWA: service worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
