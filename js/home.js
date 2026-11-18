(() => {
  const target = document.getElementById('typed-name');
  if (!target) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  let index = 0;
  let position = target.textContent.length;
  let deleting = false;
  let pageVisible = !document.hidden;
  let inViewport = true;
  let observer = null;
  const words = {
    en: ['Front-End Developer', 'Web Designer'],
    id: ['Front-End Developer', 'Web Designer']
  };

  const stop = () => {
    window.clearTimeout(timer);
    timer = 0;
  };

  const step = () => {
    if (!pageVisible || !inViewport || reducedMotion.matches) return;
    const currentWords = words[document.documentElement.lang] || words.en;
    const current = currentWords[index % currentWords.length];

    if (deleting) {
      position -= 1;
      target.textContent = current.slice(0, Math.max(0, position));
      if (position <= 0) {
        deleting = false;
        index = (index + 1) % currentWords.length;
        timer = window.setTimeout(step, 280);
      } else {
        timer = window.setTimeout(step, 34);
      }
      return;
    }

    position += 1;
    target.textContent = current.slice(0, position);
    if (position >= current.length) {
      deleting = true;
      timer = window.setTimeout(step, 2200);
    } else {
      timer = window.setTimeout(step, 62);
    }
  };

  const syncMotion = () => {
    stop();
    if (reducedMotion.matches) {
      target.textContent = (words[document.documentElement.lang] || words.en)[0];
      position = target.textContent.length;
      return;
    }
    if (!pageVisible || !inViewport) return;
    position = 0;
    index = 0;
    deleting = false;
    step();
  };

  const onVisibility = () => {
    pageVisible = !document.hidden;
    if (!pageVisible) stop();
    else syncMotion();
  };
  const onViewport = (entries) => {
    inViewport = entries.some((entry) => entry.isIntersecting);
    if (!inViewport) {
      stop();
      if (!reducedMotion.matches) {
        target.textContent = (words[document.documentElement.lang] || words.en)[0];
        position = target.textContent.length;
        index = 0;
        deleting = false;
      }
    } else {
      syncMotion();
    }
  };
  const onPageHide = (event) => {
    stop();
    if (event.persisted) return;
    reducedMotion.removeEventListener?.('change', syncMotion);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('languagechange', syncMotion);
    window.removeEventListener('pageshow', onPageShow);
    observer?.disconnect();
  };
  const onPageShow = (event) => {
    if (event.persisted) syncMotion();
  };

  reducedMotion.addEventListener?.('change', syncMotion);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('languagechange', syncMotion);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(onViewport, { threshold: 0.15 });
    observer.observe(target.closest('.home') || target);
  }
  syncMotion();
})();
