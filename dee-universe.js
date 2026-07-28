(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  const labButton = document.querySelector('[data-open-lab]');
  const atlasDialog = document.getElementById('atlas-dialog');

  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });

  scrollLinks.forEach((link) => link.addEventListener('click', closeMenu));

  document.querySelectorAll('.capability').forEach((card) => {
    card.addEventListener('click', () => {
      const willOpen = card.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('.capability[aria-expanded="true"]').forEach((openCard) => {
        openCard.setAttribute('aria-expanded', 'false');
      });
      card.setAttribute('aria-expanded', String(willOpen));
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
  });

  const activateTab = (tab) => {
    const tabList = tab.closest('[role="tablist"]');
    const tabs = tabList?.querySelectorAll('[role="tab"]') || [];
    const root = tab.closest('.tabs');
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = root?.querySelector(`#${item.getAttribute('aria-controls')}`);
      if (panel) panel.hidden = !active;
    });
  };

  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      const index = tabs.indexOf(tab);
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      event.preventDefault();
      tabs[next].focus();
      activateTab(tabs[next]);
    });
  });

  labButton?.addEventListener('click', () => {
    const observedTab = document.getElementById('tab-observed');
    if (observedTab) activateTab(observedTab);
  });

  document.querySelectorAll('[data-atlas-open]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!atlasDialog) return;
      atlasDialog.showModal();
      atlasDialog.querySelector('video')?.play().catch(() => {});
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => atlasDialog?.close());
  });

  document.querySelectorAll('form[data-access-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const submitButton = form.querySelector('button[type="submit"]');
      const notice = form.querySelector('.form-notice');
      const originalButtonLabel = submitButton?.textContent;
      const language = document.documentElement.lang.startsWith('es') ? 'es' : 'en';
      const messages = language === 'es'
        ? {
            sending: 'ENVIANDO…',
            success: 'Gracias. Tu solicitud fue enviada correctamente.',
            error: 'No fue posible enviar la solicitud. Inténtalo de nuevo o escribe a info@dee-universe.com.',
          }
        : {
            sending: 'SENDING…',
            success: 'Thank you. Your request was sent successfully.',
            error: 'We could not send your request. Please try again or email info@dee-universe.com.',
          };

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = messages.sending;
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) throw new Error('Contact request failed');

        form.reset();
        if (notice) {
          notice.textContent = messages.success;
          notice.hidden = false;
          notice.focus();
        }
      } catch {
        if (notice) {
          notice.textContent = messages.error;
          notice.hidden = false;
          notice.focus();
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonLabel;
        }
      }
    });
  });
})();
