// ===== Hero crumbs =====
const crumbsEl = document.getElementById('crumbs');
if (crumbsEl) {
  const count = window.innerWidth < 700 ? 10 : 20;
  for (let i = 0; i < count; i++) {
    const crumb = document.createElement('span');
    crumb.className = 'crumb';
    const size = 3 + Math.random() * 4;
    crumb.style.width = size + 'px';
    crumb.style.height = size + 'px';
    crumb.style.left = Math.random() * 100 + '%';
    crumb.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    crumb.style.animationDuration = (7 + Math.random() * 9) + 's';
    crumb.style.animationDelay = (Math.random() * 10) + 's';
    crumb.style.opacity = String(0.25 + Math.random() * 0.45);
    crumbsEl.appendChild(crumb);
  }
}

// ===== Photo marquee (façon story highlights) =====
const marqueeTrack = document.getElementById('marqueeTrack');
if (marqueeTrack) {
  const items = [
    ['assets/img/cookie-rafaello.jpg', 'Rafaello'],
    ['assets/img/cheesecake-oreo.jpg', 'Oreo'],
    ['assets/img/cookie-pistache.jpg', 'Pistache'],
    ['assets/img/cheesecake-framboise.jpg', 'Framboise'],
    ['assets/img/cookie-bueno.jpg', 'Bueno'],
    ['assets/img/cheesecake-caramelnoix.jpg', 'Caramel & Noix'],
    ['assets/img/cookie-ferrero.jpg', 'Ferrero'],
    ['assets/img/cheesecake-bueno.jpg', 'Bueno'],
    ['assets/img/cookie-snickers.jpg', 'Snickers'],
    ['assets/img/cheesecake-ferrero.jpg', 'Ferrero'],
  ];
  const renderItems = (list) => list.map(([src, label]) => `
    <div class="marquee-item">
      <span class="ring"><img src="${src}" alt="${label}" loading="lazy"></span>
      <span>${label}</span>
    </div>
  `).join('');
  marqueeTrack.innerHTML = renderItems(items) + renderItems(items);
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
