(() => {
  'use strict';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const header = qs('.site-header');
  const menuToggle = qs('.menu-toggle');
  const mobileMenu = qs('.mobile-menu');

  const closeMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const next = !mobileMenu.classList.contains('is-open');
      mobileMenu.classList.toggle('is-open', next);
      menuToggle.setAttribute('aria-expanded', String(next));
    });
    qsa('a', mobileMenu).forEach((link) => link.addEventListener('click', closeMenu));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 14);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = qs(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', id);
    });
  });

  const concept = qs('[data-concept]');
  if (concept) {
    const phases = ['grid', 'neighbor', 'tick', 'evolution'];
    const labels = {
      es: {
        grid: ['1. Retícula 3D', 'El mundo se representa como posiciones discretas organizadas en tres dimensiones.'],
        neighbor: ['2. Entorno local', 'Una posición consulta información local. La figura destaca conceptualmente la posición central y su entorno inmediato.'],
        tick: ['3. Un tick', 'Todas las posiciones aplican la misma dinámica para preparar el siguiente estado. La animación no reproduce la regla propietaria.'],
        evolution: ['4. Evolución', 'Al repetir los ticks aparece una historia global: patrones, encuentros, persistencia y transformaciones.']
      },
      en: {
        grid: ['1. 3D lattice', 'The world is represented as discrete positions organized in three dimensions.'],
        neighbor: ['2. Local neighborhood', 'A position reads local information. The figure conceptually highlights the center position and its immediate surroundings.'],
        tick: ['3. One tick', 'All positions apply the same dynamics to prepare the next state. The animation does not reproduce the proprietary rule.'],
        evolution: ['4. Evolution', 'Repeated ticks create a global history: patterns, encounters, persistence and transformations.']
      }
    };
    const lang = document.documentElement.lang.startsWith('es') ? 'es' : 'en';
    const title = qs('[data-concept-title]', concept);
    const body = qs('[data-concept-body]', concept);
    const buttons = qsa('[data-phase]', concept);
    const play = qs('[data-play-toggle]', concept);
    let index = 0;
    let timer = null;
    let playing = !reducedMotion.matches;

    const setPhase = (phase) => {
      const nextIndex = phases.indexOf(phase);
      index = nextIndex >= 0 ? nextIndex : 0;
      concept.dataset.phase = phases[index];
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.phase === phases[index])));
      const copy = labels[lang][phases[index]];
      if (title) title.textContent = copy[0];
      if (body) body.textContent = copy[1];
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (!playing || reducedMotion.matches) return;
      timer = window.setInterval(() => setPhase(phases[(index + 1) % phases.length]), 2600);
    };
    const updatePlayLabel = () => {
      if (!play) return;
      play.textContent = lang === 'es' ? (playing ? 'Pausar' : 'Reproducir') : (playing ? 'Pause' : 'Play');
      play.setAttribute('aria-pressed', String(playing));
    };

    buttons.forEach((button) => button.addEventListener('click', () => {
      setPhase(button.dataset.phase);
      start();
    }));
    if (play) play.addEventListener('click', () => {
      playing = !playing;
      updatePlayLabel();
      start();
    });
    reducedMotion.addEventListener?.('change', () => {
      if (reducedMotion.matches) { playing = false; stop(); }
      updatePlayLabel();
    });

    setPhase('grid');
    updatePlayLabel();
    start();
  }

  qsa('video[data-dee-video]').forEach((video) => {
    video.addEventListener('error', () => {
      const card = video.closest('.video-card');
      if (card) card.classList.add('video-unavailable');
    });
  });
})();
