(function () {
  'use strict';

  const SSPOISK_URL = 'https://www.sspoisk.ru';
  const KINOPOISK_HOST = 'www.kinopoisk.ru';
  const MIRROR_HOSTS = ['www.sspoisk.ru', 'fbsite.top'];

  function isMirrorHost() {
    return MIRROR_HOSTS.includes(window.location.hostname);
  }

  function normalizeMirrorLayout() {
    const wrapper = document.querySelector('#wrapper, .wrapper');
    if (!wrapper) return false;

    const mainContainer = wrapper.querySelector('#mainContainer, .mainContainer');
    if (!mainContainer) return false;

    Array.from(wrapper.children).forEach(function (child) {
      if (child !== mainContainer) {
        child.remove();
      }
    });

    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    wrapper.style.height = '100%';
    mainContainer.style.height = '100%';
    return true;
  }

  function initMirrorCleanup() {
    if (normalizeMirrorLayout()) return;

    var cleanupObserver = new MutationObserver(function () {
      if (normalizeMirrorLayout()) {
        cleanupObserver.disconnect();
      }
    });

    cleanupObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function isFilmOrSeriesPage() {
    const path = window.location.pathname;
    return path.includes('/film') || path.includes('/series');
  }

  function getButtonText() {
    const path = window.location.pathname;
    if (path.includes('/series')) return 'Смотреть сериал';
    if (path.includes('/film')) return 'Смотреть фильм';
    return 'Смотреть бесплатно';
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'kinoext-watch-btn';
    btn.type = 'button';
    btn.textContent = getButtonText();
    btn.title = 'Открыть на sspoisk.ru';

    btn.addEventListener('click', function () {
      const path = window.location.pathname + window.location.search;
      const url = SSPOISK_URL + (path === '/' ? '' : path);
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    return btn;
  }

  function updateButton() {
    const existing = document.getElementById('kinoext-watch-btn');

    if (isFilmOrSeriesPage()) {
      if (existing) {
        existing.textContent = getButtonText();
      } else {
        document.body.appendChild(createButton());
      }
    } else if (existing) {
      existing.remove();
    }
  }

  function init() {
    if (window.location.hostname !== KINOPOISK_HOST) return;

    updateButton();

    window.addEventListener('popstate', updateButton);

    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;
    history.pushState = function () {
      origPushState.apply(this, arguments);
      updateButton();
    };
    history.replaceState = function () {
      origReplaceState.apply(this, arguments);
      updateButton();
    };

    // При смене контента (SPA) проверяем путь — без таймера, только по мутациям DOM
    var lastPath = window.location.pathname;
    var pathCheckTimer = null;
    var pathObserver = new MutationObserver(function () {
      clearTimeout(pathCheckTimer);
      pathCheckTimer = setTimeout(function () {
        if (window.location.pathname !== lastPath) {
          lastPath = window.location.pathname;
          updateButton();
        }
      }, 100);
    });
    pathObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (isMirrorHost()) {
        initMirrorCleanup();
      } else {
        init();
      }
    });
  } else {
    if (isMirrorHost()) {
      initMirrorCleanup();
    } else {
      init();
    }
  }
})();
