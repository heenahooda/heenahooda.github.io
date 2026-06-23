// Scroll-triggered fade-ins
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Dark mode: respect system preference, allow manual override, no flash
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(isDark) {
    root.classList.toggle('dark', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }
  applyTheme(stored ? stored === 'dark' : prefersDark);

  themeToggle.addEventListener('click', () => {
    const isDark = !root.classList.contains('dark');
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Expandable case studies
  document.querySelectorAll('[data-toggle-case]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      panel.classList.toggle('open', !isOpen);
      btn.lastChild.textContent = isOpen ? ' View case study' : ' Hide case study';
    });
  });

  // ---------- Command palette ----------
  (function () {
    const overlay = document.getElementById('palette-overlay');
    const trigger = document.getElementById('palette-trigger');
    const input = document.getElementById('palette-input');
    const results = document.getElementById('palette-results');
    let selectedIndex = 0;
    let lastFocused = null;

    const ITEMS = [
      { icon: '🏠', label: 'Top of page', sub: 'Hero', action: () => scrollToId('main') },
      { icon: '🧰', label: 'Skills', sub: 'Section', action: () => scrollToId('main') },
      { icon: '🌧️', label: 'Rainyway', sub: 'Project — Devathon selected', action: () => scrollToId('card-rainyway') },
      { icon: '🌾', label: 'AgriSmart', sub: 'Project — research-backed', action: () => scrollToId('card-agrismart') },
      { icon: '🧭', label: 'Experience & Education', sub: 'Section', action: () => scrollToId('experience') },
      { icon: '✉️', label: 'Email Heena', sub: 'heenahooda2@gmail.com', action: () => window.location.href = 'mailto:heenahooda2@gmail.com' },
      { icon: '📞', label: 'Call', sub: '9351584098', action: () => window.location.href = 'tel:9351584098' },
      { icon: '🔗', label: 'LinkedIn', sub: 'Opens in new tab', action: () => window.open('https://linkedin.com/in/heena-hooda-870b40323', '_blank') },
      { icon: '💻', label: 'GitHub', sub: 'Opens in new tab', action: () => window.open('https://github.com/heenahooda', '_blank') },
      { icon: '🌙', label: 'Toggle dark mode', sub: '', action: () => themeToggle.click() },
    ];

    function scrollToId(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function render(list) {
      results.innerHTML = '';
      if (list.length === 0) {
        results.innerHTML = '<div class="palette-empty">No matches. Try "project", "contact", or "dark".</div>';
        return;
      }
      list.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-item';
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', String(i === selectedIndex));
        btn.innerHTML = `<span class="pi-icon">${item.icon}</span><span>${item.label}</span><span class="pi-sub">${item.sub}</span>`;
        btn.addEventListener('click', () => { item.action(); closePalette(); });
        results.appendChild(btn);
      });
    }

    let filtered = ITEMS;

    function filterItems(query) {
      const q = query.trim().toLowerCase();
      filtered = q
        ? ITEMS.filter((it) => (it.label + ' ' + it.sub).toLowerCase().includes(q))
        : ITEMS;
      selectedIndex = 0;
      render(filtered);
    }

    function openPalette() {
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      input.value = '';
      filterItems('');
      setTimeout(() => input.focus(), 30);
      document.body.style.overflow = 'hidden';
    }

    function closePalette() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    trigger.addEventListener('click', openPalette);

    document.addEventListener('keydown', (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        overlay.classList.contains('open') ? closePalette() : openPalette();
      } else if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closePalette();
      }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePalette(); });

    input.addEventListener('input', () => filterItems(input.value));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
        render(filtered);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        render(filtered);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          closePalette();
        }
      }
    });
  })();

  // Signature hero element: cursor-reactive data-trail graph.
  (function () {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    const heroEl = canvas.closest('.hero');
    let width, height, dpr;
    let points = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let raf = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = heroEl.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const count = Math.min(46, Math.floor((width * height) / 14000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }

    function isDark() { return root.classList.contains('dark'); }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const lineColor = isDark() ? 'rgba(91,159,227,' : 'rgba(24,95,165,';
      const dotColor = isDark() ? 'rgba(91,159,227,' : 'rgba(24,95,165,';

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160 && dist > 0.01) {
            p.x += (dx / dist) * 0.12;
            p.y += (dy / dist) * 0.12;
          }
        }
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x, dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 95) {
            ctx.strokeStyle = lineColor + (0.12 * (1 - dist / 95)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of points) {
        let r = 1.6;
        let alpha = 0.45;
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const t = 1 - dist / 160;
            r = 1.6 + t * 1.8;
            alpha = 0.45 + t * 0.4;
          }
        }
        ctx.fillStyle = dotColor + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function handleMove(e) {
      const rect = heroEl.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function handleLeave() { mouse.active = false; }

    resize();
    window.addEventListener('resize', resize);
    heroEl.addEventListener('pointermove', handleMove);
    heroEl.addEventListener('pointerleave', handleLeave);

    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(draw);
    } else {
      draw();
      cancelAnimationFrame(raf);
    }
  })();

  // Flowing menu: click a row to jump to that project card
  document.querySelectorAll('[data-flow-target]').forEach((item) => {
    item.addEventListener('click', () => {
      const target = document.getElementById(item.getAttribute('data-flow-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Dome gallery: certifications arranged on a curved surface, drag to rotate
  (function () {
    const wrap = document.getElementById('dome-wrap');
    const stage = document.getElementById('dome-stage');
    const cards = Array.from(stage.querySelectorAll('.dome-card'));
    const radius = 230;
    const count = cards.length;

    cards.forEach((card, i) => {
      const angle = (360 / count) * i;
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      card.dataset.angle = angle;
      card.classList.add('positioned');
    });

    let rotation = 0;
    let isDragging = false;
    let startX = 0;
    let startRotation = 0;
    let autoSpin = null;

    function applyRotation() {
      stage.style.transform = `rotateY(${rotation}deg)`;
    }

    function startAutoSpin() {
      stopAutoSpin();
      autoSpin = setInterval(() => {
        rotation += 0.12;
        applyRotation();
      }, 30);
    }
    function stopAutoSpin() {
      if (autoSpin) { clearInterval(autoSpin); autoSpin = null; }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) startAutoSpin();

    function onPointerDown(e) {
      isDragging = true;
      wrap.classList.add('grabbing');
      startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      startRotation = rotation;
      stopAutoSpin();
    }
    function onPointerMove(e) {
      if (!isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      rotation = startRotation + (x - startX) * 0.4;
      applyRotation();
    }
    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      wrap.classList.remove('grabbing');
      if (!prefersReducedMotion) startAutoSpin();
    }

    wrap.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    wrap.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  })();
