// site.js — mobile menu, header state, scroll reveal
(function () {
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('mobileNav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const header = document.querySelector('.site-header');
  const onScroll = () => { if (header) header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // home: stagger service rows, video cards and section headings
  document.querySelectorAll('.svc-list .svc-row, .vid-row .vid-card').forEach(el => {
    el.classList.add('rv');
    el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.07) + 's';
  });
  document.querySelectorAll('.sec > .wrap > .eyebrow, .sec > .wrap > .h2, .vid-sec .svc-head').forEach(el => el.classList.add('rv'));
  const svcList = document.querySelector('.svc-list.rv');
  if (svcList) svcList.classList.remove('rv');

  // home: hero photo follows the mouse a little
  const hero = document.querySelector('.hero'), visual = document.querySelector('.hero-visual');
  if (hero && visual && !reduce && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      visual.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      visual.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('mouseleave', () => { visual.style.setProperty('--mx', 0); visual.style.setProperty('--my', 0); });
  }

  // home: count up numeric credentials (e.g. "15+")
  document.querySelectorAll('.cred-strip .k').forEach(k => {
    const m = k.textContent.trim().match(/^(\d+)(\+?)$/);
    if (!m || reduce) return;
    const target = +m[1], start = performance.now() + 900, dur = 1400;
    k.textContent = '0' + m[2];
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / dur)), e = 1 - Math.pow(1 - t, 3);
      k.textContent = Math.round(target * e) + m[2];
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // home: cards tilt toward the cursor
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.feat, .visit-card, .svc-feature, .doc-cols').forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  const els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in', 'tilt-ready')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) {
      const el = e.target;
      el.classList.add('in'); io.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = '0s'; el.classList.add('tilt-ready'); }, 1200); // stagger/tilt only after entry
    } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();
