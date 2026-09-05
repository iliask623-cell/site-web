// ===== Hero embers =====
const embersEl = document.getElementById('embers');
if (embersEl) {
  const count = window.innerWidth < 700 ? 16 : 30;
  for (let i = 0; i < count; i++) {
    const ember = document.createElement('span');
    ember.className = 'ember';
    ember.style.left = Math.random() * 100 + '%';
    ember.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    ember.style.animationDuration = (6 + Math.random() * 8) + 's';
    ember.style.animationDelay = (Math.random() * 10) + 's';
    ember.style.opacity = String(0.3 + Math.random() * 0.5);
    embersEl.appendChild(ember);
  }
}

// ===== Loader =====
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 500);
});

// ===== Header scroll state =====
const header = document.getElementById('siteHeader');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Mobile nav =====
const burger = document.getElementById('burger');
const mainNav = document.getElementById('mainNav');
burger.addEventListener('click', () => {
  mainNav.classList.toggle('open');
  burger.classList.toggle('active');
});
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

// ===== Active nav link on scroll =====
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
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

// ===== Menu tabs =====
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.menu-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.menu-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
  });
});

// ===== Footer year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== PWA: service worker + install prompt =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

let deferredInstallPrompt = null;
const installChip = document.getElementById('installChip');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installChip.hidden = false;
});
installChip.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installChip.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installChip.hidden = true;
});
