(() => {
  const query = (selector, root = document) => root.querySelector(selector);
  const queryAll = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cleanup = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  let gsap = window.gsap || null;
  let scrollTrigger = window.ScrollTrigger || null;
  let pageDisposed = false;
  let enhancementPromise = null;
  let enhancementLoaded = false;
  let smoothScrollReady = false;
  let threeSceneReady = false;
  let sectionTriggersReady = false;
  let heroIntroStarted = false;
  const scriptLoads = new Map();

  if (gsap && scrollTrigger) gsap.registerPlugin(scrollTrigger);

  const year = query('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  function addListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    cleanup.push(() => target.removeEventListener(type, listener, options));
  }

  function loadScript(src) {
    if (scriptLoads.has(src)) return scriptLoads.get(src);
    const request = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => resolve(true), { once: true });
      script.addEventListener('error', () => {
        script.remove();
        resolve(false);
      }, { once: true });
      document.head.appendChild(script);
    });
    scriptLoads.set(src, request);
    return request;
  }

  function initCursor() {
    const dot = query('#cursorDot');
    const ring = query('#cursorRing');
    if (!dot || !ring || reducedMotion.matches || !finePointer.matches) return;

    document.documentElement.classList.add('has-custom-cursor');
    let pointX = -100;
    let pointY = -100;
    let ringX = pointX;
    let ringY = pointY;
    let frame = 0;

    const move = (event) => {
      pointX = event.clientX;
      pointY = event.clientY;
      dot.style.setProperty('--cursor-x', `${pointX}px`);
      dot.style.setProperty('--cursor-y', `${pointY}px`);
      dot.classList.add('is-visible');
      ring.classList.add('is-visible');
      if (!frame) frame = requestAnimationFrame(animateRing);
    };

    function animateRing() {
      frame = 0;
      ringX += (pointX - ringX) * 0.22;
      ringY += (pointY - ringY) * 0.22;
      ring.style.setProperty('--cursor-x', `${ringX}px`);
      ring.style.setProperty('--cursor-y', `${ringY}px`);
      if (Math.abs(pointX - ringX) > 0.5 || Math.abs(pointY - ringY) > 0.5) {
        frame = requestAnimationFrame(animateRing);
      }
    }

    const setHover = (event, hovering) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest('a, button, input, textarea, select, [role="button"]')) return;
      ring.classList.toggle('is-hovering', hovering);
    };

    const hide = () => {
      dot.classList.remove('is-visible');
      ring.classList.remove('is-visible');
    };
    const deactivate = () => {
      if (!reducedMotion.matches && finePointer.matches) return;
      cancelAnimationFrame(frame);
      frame = 0;
      hide();
      document.documentElement.classList.remove('has-custom-cursor');
    };

    addListener(window, 'pointermove', move, { passive: true });
    addListener(window, 'pointerover', (event) => setHover(event, true), { passive: true });
    addListener(window, 'pointerout', (event) => setHover(event, false), { passive: true });
    addListener(window, 'pointerleave', hide, { passive: true });
    addListener(reducedMotion, 'change', deactivate);
    addListener(finePointer, 'change', deactivate);
    cleanup.push(() => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('has-custom-cursor');
    });
  }

  function initNavbar() {
    const nav = query('#navbar');
    const toggle = query('#navToggle');
    const menu = query('#navMenu');
    const links = queryAll('.nav-link');
    const sections = queryAll('main section[id]');
    if (!nav || !toggle || !menu) return;

    const setMenuState = (open, restoreFocus = false) => {
      nav.classList.toggle('is-menu-open', open);
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      const language = document.documentElement.lang === 'id' ? 'id' : 'en';
      const label = open
        ? (language === 'id' ? 'Tutup navigasi' : 'Close navigation')
        : (language === 'id' ? 'Buka navigasi' : 'Open navigation');
      toggle.setAttribute('aria-label', label);
      if (open) menu.querySelector('a')?.focus({ preventScroll: true });
      else if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    const updateScrolled = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    const onToggle = () => setMenuState(toggle.getAttribute('aria-expanded') !== 'true', true);
    const onLink = (event) => {
      if (!nav.classList.contains('is-menu-open')) return;
      setMenuState(false);
      const href = event.currentTarget.getAttribute('href');
      const destination = href?.startsWith('#') ? query(href) : null;
      destination?.focus({ preventScroll: true });
    };
    const onResize = () => {
      if (window.innerWidth > 780 && nav.classList.contains('is-menu-open')) setMenuState(false);
    };
    const onLanguageChange = () => {
      const language = document.documentElement.lang === 'id' ? 'id' : 'en';
      const key = toggle.getAttribute('aria-expanded') === 'true' ? 'nav_close' : 'nav_open';
      const labels = {
        en: { nav_open: 'Open navigation', nav_close: 'Close navigation' },
        id: { nav_open: 'Buka navigasi', nav_close: 'Tutup navigasi' }
      };
      toggle.setAttribute('aria-label', labels[language][key]);
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-menu-open')) {
        event.preventDefault();
        setMenuState(false, true);
        return;
      }
      if (event.key !== 'Tab' || !nav.classList.contains('is-menu-open')) return;
      const focusable = queryAll('button:not([disabled]), a[href]', nav).filter((element) => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.documentElement.classList.add('js-nav');
    toggle.addEventListener('click', onToggle);
    links.forEach((link) => link.addEventListener('click', onLink));
    window.addEventListener('scroll', updateScrolled, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('languagechange', onLanguageChange);
    updateScrolled();
    cleanup.push(() => {
      toggle.removeEventListener('click', onToggle);
      links.forEach((link) => link.removeEventListener('click', onLink));
      window.removeEventListener('scroll', updateScrolled);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('languagechange', onLanguageChange);
      document.documentElement.classList.remove('js-nav');
      document.body.classList.remove('menu-open');
    });

    const markActive = (id) => {
      links.forEach((link) => {
        const active = link.dataset.section === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      document.dispatchEvent(new CustomEvent('portfolio:sectionchange', { detail: { id } }));
    };

    if (gsap && scrollTrigger) {
      const triggers = sections.map((section) => scrollTrigger.create({
        trigger: section,
        start: 'top 54%',
        end: 'bottom 54%',
        onEnter: () => markActive(section.id),
        onEnterBack: () => markActive(section.id)
      }));
      cleanup.push(() => triggers.forEach((trigger) => trigger.kill()));
      if (window.scrollY < 30) markActive('home');
    } else if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const candidate = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (candidate) markActive(candidate.target.id);
      }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5] });
      sections.forEach((section) => observer.observe(section));
      cleanup.push(() => observer.disconnect());
    }
  }

  function initSectionTriggers() {
    if (!gsap || !scrollTrigger || sectionTriggersReady) return;
    const sections = queryAll('main section[id]');
    if (!sections.length) return;
    const dispatchSection = (id) => {
      document.dispatchEvent(new CustomEvent('portfolio:sectionchange', { detail: { id } }));
    };
    const triggers = sections.map((section) => scrollTrigger.create({
      trigger: section,
      start: 'top 54%',
      end: 'bottom 54%',
      onEnter: () => dispatchSection(section.id),
      onEnterBack: () => dispatchSection(section.id)
    }));
    sectionTriggersReady = true;
    if (window.scrollY < 30) dispatchSection('home');
    cleanup.push(() => {
      triggers.forEach((trigger) => trigger.kill());
      sectionTriggersReady = false;
    });
  }

  function initSmoothScroll() {
    if (smoothScrollReady || !window.Lenis || reducedMotion.matches || !finePointer.matches) return;

    let lenis;
    try {
      lenis = new window.Lenis({
        autoRaf: false,
        anchors: true,
        smoothWheel: true,
        syncTouch: false,
        respectReducedMotion: true
      });
    } catch {
      return;
    }
    smoothScrollReady = true;
    document.documentElement.classList.add('lenis-enabled');

    let running = false;
    let raf = 0;
    let idleFrames = 0;
    let destroyed = false;
    const stop = () => {
      if (!running) return;
      running = false;
      idleFrames = 0;
      if (gsap?.ticker) gsap.ticker.remove(tick);
      else cancelAnimationFrame(raf);
      raf = 0;
    };

    const tick = (time) => {
      lenis.raf(time * 1000);
      if (!lenis.isScrolling && Math.abs(lenis.velocity || 0) < 0.01) idleFrames += 1;
      else idleFrames = 0;
      if (idleFrames > 10) stop();
    };

    const start = () => {
      if (running || document.hidden || destroyed) return;
      running = true;
      idleFrames = 0;
      if (gsap?.ticker) gsap.ticker.add(tick);
      else raf = requestAnimationFrame(function animate(time) {
        if (!running) return;
        tick(time / 1000);
        if (running) raf = requestAnimationFrame(animate);
      });
    };

    const onScroll = () => scrollTrigger?.update();
    const onInput = (event) => {
      if (event.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
      start();
    };
    const onVisibility = () => {
      if (destroyed) return;
      if (document.hidden) {
        stop();
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      smoothScrollReady = false;
      stop();
      lenis.off('scroll', onScroll);
      lenis.destroy();
      document.documentElement.classList.remove('lenis-enabled');
      document.removeEventListener('wheel', onInput, true);
      document.removeEventListener('touchstart', onInput, true);
      document.removeEventListener('keydown', onInput, true);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionPreference);
      finePointer.removeEventListener('change', onMotionPreference);
    };
    const onMotionPreference = () => {
      if (reducedMotion.matches || !finePointer.matches) destroy();
    };

    lenis.on('scroll', onScroll);
    document.addEventListener('wheel', onInput, { passive: true, capture: true });
    document.addEventListener('touchstart', onInput, { passive: true, capture: true });
    document.addEventListener('keydown', onInput, true);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionPreference);
    finePointer.addEventListener('change', onMotionPreference);
    cleanup.push(destroy);
  }

  function initReveals() {
    const elements = queryAll('[data-aos]');
    if (!elements.length || !('IntersectionObserver' in window) || reducedMotion.matches) return;
    document.documentElement.classList.add('has-reveals');
    const activeTweens = new Set();
    let observer;

    const reveal = (element) => {
      const delay = Math.min(Number.parseInt(element.dataset.aosDelay || '0', 10) || 0, 500) / 1000;
      if (gsap) {
        const from = { opacity: 0, duration: 0.72, delay, ease: 'power2.out', clearProps: 'transform' };
        if (element.dataset.aos === 'fade-right') from.x = -24;
        else if (element.dataset.aos === 'fade-left') from.x = 24;
        else from.y = 24;
        const tween = gsap.fromTo(element, from, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: from.duration,
          delay,
          ease: from.ease,
          clearProps: 'transform',
          onComplete: () => {
            activeTweens.delete(tween);
            element.classList.add('aos-animate');
          }
        });
        activeTweens.add(tween);
      } else {
        window.setTimeout(() => element.classList.add('aos-animate'), delay * 1000);
      }
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    elements.forEach((element) => observer.observe(element));
    const onMotionPreference = () => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      activeTweens.forEach((tween) => { tween.progress(1); tween.kill(); });
      activeTweens.clear();
      elements.forEach((element) => element.classList.add('aos-animate'));
      document.documentElement.classList.remove('has-reveals');
    };
    reducedMotion.addEventListener('change', onMotionPreference);
    cleanup.push(() => {
      observer.disconnect();
      activeTweens.forEach((tween) => tween.kill());
      reducedMotion.removeEventListener('change', onMotionPreference);
      document.documentElement.classList.remove('has-reveals');
    });
  }

  function initHeroIntro() {
    if (!gsap || reducedMotion.matches || heroIntroStarted) return;
    const parts = queryAll('.glitch-wrapper, .home-subtitle, .home-actions, .stats-bar');
    if (!parts.length) return;
    heroIntroStarted = true;
    const tween = gsap.from(parts, {
      y: 16,
      opacity: 0,
      duration: 0.65,
      stagger: 0.09,
      ease: 'power2.out',
      clearProps: 'transform,opacity'
    });
    const onMotionPreference = () => {
      if (reducedMotion.matches) tween.progress(1);
    };
    reducedMotion.addEventListener('change', onMotionPreference);
    cleanup.push(() => {
      tween.kill();
      reducedMotion.removeEventListener('change', onMotionPreference);
    });
  }

  function initCounters() {
    const counters = queryAll('.stat-number[data-target]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    let frames = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number.parseInt(element.dataset.target || '0', 10);
        observer.unobserve(element);
        if (reducedMotion.matches) {
          element.textContent = `${target}+`;
          return;
        }

        const start = performance.now();
        const duration = 680;
        const draw = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = `${Math.round(target * eased)}+`;
          if (progress < 1) {
            const frame = requestAnimationFrame(draw);
            frames.add(frame);
          } else {
            element.textContent = `${target}+`;
          }
        };
        const frame = requestAnimationFrame(draw);
        frames.add(frame);
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => observer.observe(counter));
    const onMotionPreference = () => {
      if (!reducedMotion.matches) return;
      frames.forEach((frame) => cancelAnimationFrame(frame));
      frames.clear();
      counters.forEach((element) => {
        element.textContent = `${Number.parseInt(element.dataset.target || '0', 10)}+`;
      });
      observer.disconnect();
    };
    reducedMotion.addEventListener('change', onMotionPreference);
    cleanup.push(() => {
      observer.disconnect();
      frames.forEach((frame) => cancelAnimationFrame(frame));
      frames.clear();
      reducedMotion.removeEventListener('change', onMotionPreference);
    });
  }

  function initCardTilt() {
    if (!finePointer.matches || reducedMotion.matches) return;
    const cards = queryAll('.project-card');
    if (!cards.length) return;

    const reset = (card) => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    };
    const onMotionPreference = () => {
      if (reducedMotion.matches) cards.forEach(reset);
    };

    cards.forEach((card) => {
      addListener(card, 'pointermove', (event) => {
        if (reducedMotion.matches || event.pointerType === 'touch') return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${-y * 4}deg`);
        card.style.setProperty('--tilt-y', `${x * 4}deg`);
        card.classList.add('is-tilting');
      }, { passive: true });
      addListener(card, 'pointerleave', () => reset(card), { passive: true });
    });
    addListener(reducedMotion, 'change', onMotionPreference);
    cleanup.push(() => cards.forEach(reset));
  }

  function initMagneticButtons() {
    if (!finePointer.matches || reducedMotion.matches) return;
    const buttons = queryAll('.home-actions .btn-primary, .home-actions .btn-secondary, .home-actions .btn-tertiary, .btn-submit');
    if (!buttons.length) return;

    const reset = (button) => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    };
    const onMotionPreference = () => {
      if (reducedMotion.matches) buttons.forEach(reset);
    };

    buttons.forEach((button) => {
      addListener(button, 'pointermove', (event) => {
        if (reducedMotion.matches || event.pointerType === 'touch') return;
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.setProperty('--mag-x', `${x * 5}px`);
        button.style.setProperty('--mag-y', `${y * 5}px`);
      }, { passive: true });
      addListener(button, 'pointerleave', () => reset(button), { passive: true });
    });
    addListener(reducedMotion, 'change', onMotionPreference);
    cleanup.push(() => buttons.forEach(reset));
  }

  function initThreeScene() {
    const canvas = query('#threeCanvas');
    const fallback = query('.hero-object-fallback');
    if (!canvas || !window.THREE || reducedMotion.matches || threeSceneReady) return;
    threeSceneReady = true;

    const THREE = window.THREE;
    let renderer;
    let scene;
    let observer;
    let frame = 0;
    let contextLost = false;
    let motionDisabled = false;
    let sceneInView = true;
    let section = 'home';
    let isVisible = !document.hidden;
    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;
    let sectionTarget = null;
    const disposable = [];

    try {
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
      camera.position.set(0, 0, 17);
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      scene.add(new THREE.AmbientLight(0x9abac7, 0.72));
      const cyanLight = new THREE.PointLight(0x62f4f2, 7, 24);
      cyanLight.position.set(-4, 4, 6);
      scene.add(cyanLight);
      const pinkLight = new THREE.PointLight(0xff6f9e, 5, 22);
      pinkLight.position.set(4, -2, 5);
      scene.add(pinkLight);

      const group = new THREE.Group();
      scene.add(group);
      const plateGeometry = new THREE.BoxGeometry(4.5, 3, 0.18, 1, 1, 1);
      const plateMaterial = new THREE.MeshStandardMaterial({ color: 0x10262d, metalness: 0.38, roughness: 0.42, transparent: true, opacity: 0.54, emissive: 0x061216, emissiveIntensity: 0.16 });
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      group.add(plate);
      disposable.push(plateGeometry, plateMaterial);
      const edgeGeometry = new THREE.EdgesGeometry(plateGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x62f4f2, transparent: true, opacity: 0.5 });
      group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
      disposable.push(edgeGeometry, edgeMaterial);

      const lettering = document.createElement('canvas');
      lettering.width = 768;
      lettering.height = 512;
      const context = lettering.getContext('2d');
      context.clearRect(0, 0, lettering.width, lettering.height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '900 300px Orbitron, sans-serif';
      context.lineWidth = 10;
      context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      context.strokeText('AG', lettering.width / 2, lettering.height / 2 + 14);
      context.fillStyle = '#e8ffff';
      context.fillText('AG', lettering.width / 2, lettering.height / 2 + 14);
      const texture = new THREE.CanvasTexture(lettering);
      texture.needsUpdate = true;
      if ('encoding' in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
      const letterMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      const letters = new THREE.Mesh(new THREE.PlaneGeometry(4.35, 2.9), letterMaterial);
      letters.position.z = 0.12;
      group.add(letters);
      disposable.push(texture, letterMaterial, letters.geometry);

      const ringGeometry = new THREE.TorusGeometry(2.7, 0.018, 8, 112);
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00d9e8, transparent: true, opacity: 0.46 });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.set(0.84, 0.25, -0.18);
      group.add(ring);
      disposable.push(ringGeometry, ringMaterial);

      const orbitGeometry = new THREE.TorusGeometry(3.35, 0.012, 6, 112);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xff478f, transparent: true, opacity: 0.34 });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.set(-0.35, 0.62, 0.55);
      group.add(orbit);
      disposable.push(orbitGeometry, orbitMaterial);

      const orbConfigs = [
        { position: [-3.25, 1.55, 0.2], size: 0.21, color: 0x00ffff, opacity: 0.88 },
        { position: [3.1, -1.5, 0.4], size: 0.29, color: 0xff3c91, opacity: 0.86 },
        { position: [2.9, 1.65, -0.3], size: 0.13, color: 0x94faff, opacity: 0.9 },
        { position: [-2.7, -1.8, 0.3], size: 0.16, color: 0xc78bff, opacity: 0.74 }
      ];
      orbConfigs.forEach(({ position, size, color, opacity }) => {
        const geometry = new THREE.SphereGeometry(size, 14, 10);
        const material = new THREE.MeshStandardMaterial({ color, metalness: 0.28, roughness: 0.3, emissive: color, emissiveIntensity: 0.08, transparent: true, opacity });
        const orb = new THREE.Mesh(geometry, material);
        orb.position.set(...position);
        group.add(orb);
        disposable.push(geometry, material);
      });

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        group.position.x = width < 760 ? 0 : width < 1100 ? 5.8 : 6.4;
        group.position.y = width < 760 ? 2.35 : 0;
        requestRender();
      };

      const requestRender = () => {
        if (!frame && isVisible && sceneInView && sectionTarget && !contextLost && !motionDisabled) frame = requestAnimationFrame(render);
      };

      const render = () => {
        frame = 0;
        if (!isVisible || !sceneInView || !sectionTarget || contextLost || motionDisabled) return;
        const desiredX = pointerY * 0.22 + scrollProgress * 0.08;
        const desiredY = pointerX * 0.34 + (section === 'contact' ? 0.5 : 0) + scrollProgress * 0.2;
        const targetScale = section === 'contact' ? 0.78 : 1;
        const targetZ = (section === 'contact' ? -0.16 : 0.08) + scrollProgress * 0.28;
        const targetPositionY = (window.innerWidth < 760 ? 2.35 : 0) - scrollProgress * 0.52;
        group.rotation.x += (desiredX - group.rotation.x) * 0.075;
        group.rotation.y += (desiredY - group.rotation.y) * 0.075;
        group.rotation.z += (targetZ - group.rotation.z) * 0.06;
        group.position.y += (targetPositionY - group.position.y) * 0.07;
        group.scale.x += (targetScale - group.scale.x) * 0.08;
        group.scale.y = group.scale.x;
        group.scale.z = group.scale.x;
        renderer.render(scene, camera);
        const moving = Math.abs(desiredX - group.rotation.x) > 0.002
          || Math.abs(desiredY - group.rotation.y) > 0.002
          || Math.abs(group.scale.x - targetScale) > 0.002
          || Math.abs(group.rotation.z - targetZ) > 0.002
          || Math.abs(group.position.y - targetPositionY) > 0.002;
        if (moving) requestRender();
      };

      const onPointer = (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
        requestRender();
      };
      const onScroll = () => {
        const activeSection = query(`#${section}`);
        if (activeSection) {
          const rect = activeSection.getBoundingClientRect();
          const scrollRange = Math.max(1, rect.height - window.innerHeight);
          scrollProgress = Math.max(0, Math.min(1, -rect.top / scrollRange));
          requestRender();
        }
      };
      const onSection = (event) => {
        section = event.detail?.id || 'home';
        sectionTarget = section === 'home' || section === 'contact' ? section : null;
        canvas.classList.toggle('is-hidden', !sectionTarget || contextLost || motionDisabled);
        if (fallback) fallback.classList.toggle('is-hidden', Boolean(sectionTarget) && !contextLost && !motionDisabled);
        if (!sectionTarget) { cancelAnimationFrame(frame); frame = 0; }
        requestRender();
      };
      const onVisibility = () => {
        isVisible = !document.hidden;
        if (!isVisible) { cancelAnimationFrame(frame); frame = 0; }
        else requestRender();
      };
      const onMotionPreference = () => {
        motionDisabled = reducedMotion.matches;
        if (motionDisabled) {
          cancelAnimationFrame(frame);
          frame = 0;
          canvas.classList.add('is-hidden');
          if (fallback) fallback.classList.remove('is-hidden');
        } else if (!contextLost) {
          canvas.classList.toggle('is-hidden', !sectionTarget);
          if (fallback) fallback.classList.toggle('is-hidden', Boolean(sectionTarget));
          requestRender();
        }
      };
      const onContextLost = (event) => {
        event.preventDefault();
        contextLost = true;
        cancelAnimationFrame(frame);
        frame = 0;
        canvas.classList.add('is-hidden');
        if (fallback) fallback.classList.remove('is-hidden');
      };

      const sectionAtViewport = query('.nav-link.active')?.dataset.section
        || queryAll('main section[id]').find((element) => {
          const rect = element.getBoundingClientRect();
          return rect.top <= window.innerHeight * 0.54 && rect.bottom > window.innerHeight * 0.54;
        })?.id
        || 'home';
      section = sectionAtViewport;
      sectionTarget = section === 'home' || section === 'contact' ? section : null;
      canvas.classList.toggle('is-hidden', !sectionTarget);
      if (fallback) fallback.classList.toggle('is-hidden', Boolean(sectionTarget));
      resize();
      addListener(window, 'resize', resize, { passive: true });
      addListener(window, 'scroll', onScroll, { passive: true });
      if (finePointer.matches) addListener(window, 'pointermove', onPointer, { passive: true });
      addListener(document, 'portfolio:sectionchange', onSection);
      addListener(document, 'visibilitychange', onVisibility);
      addListener(reducedMotion, 'change', onMotionPreference);
      addListener(canvas, 'webglcontextlost', onContextLost, false);
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          sceneInView = visible;
          canvas.classList.toggle('is-outside-scene', !visible);
          if (visible) requestRender();
          else { cancelAnimationFrame(frame); frame = 0; }
        });
        queryAll('#home, #contact').forEach((element) => observer.observe(element));
      }

      cleanup.push(() => {
        threeSceneReady = false;
        cancelAnimationFrame(frame);
        observer?.disconnect();
        disposable.forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.forceContextLoss?.();
        canvas.classList.add('is-hidden');
        if (fallback) fallback.classList.remove('is-hidden');
      });
      requestRender();
    } catch (error) {
      threeSceneReady = false;
      disposable.forEach((resource) => resource.dispose());
      renderer?.dispose();
      renderer?.forceContextLoss?.();
      canvas.classList.add('is-hidden');
      if (fallback) fallback.classList.remove('is-hidden');
    }
  }

  function initCvModal() {
    const modal = query('#cvModal');
    const opener = query('#viewCvBtn');
    const close = query('#closeCvModal');
    const backdrop = query('#cvModalBackdrop');
    const image = query('#cvPreviewImg');
    const imageFallback = query('#cvPreviewFallback');
    const scroll = query('#cvPreviewScroll');
    const zoomOut = query('#cvZoomOut');
    const zoomIn = query('#cvZoomIn');
    const zoomReset = query('#cvZoomReset');
    const zoomLabel = query('#cvZoomLevel');
    const panel = query('.cv-modal-window', modal || document);
    if (!modal || !opener || !panel) return;

    image?.addEventListener('error', () => {
      image.hidden = true;
      if (imageFallback) imageFallback.hidden = false;
    }, { once: true });

    const levels = [75, 100, 125, 150, 200];
    let zoomIndex = 1;
    let returnFocus = opener;
    let backgroundState = [];
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const applyZoom = () => {
      const level = levels[zoomIndex];
      if (zoomLabel) zoomLabel.textContent = `${level}%`;
      if (image) {
        image.style.width = `${level}%`;
        image.style.maxWidth = `${Math.round(760 * level / 100)}px`;
      }
      if (zoomOut) zoomOut.disabled = zoomIndex === 0;
      if (zoomIn) zoomIn.disabled = zoomIndex === levels.length - 1;
      if (zoomReset) zoomReset.disabled = zoomIndex === 1;
    };

    const setBackgroundInert = (inert) => {
      const background = [query('#navbar'), query('main'), query('footer')].filter(Boolean);
      if (inert) {
        backgroundState = background.map((element) => [element, element.inert]);
        background.forEach((element) => { element.inert = true; });
      } else {
        backgroundState.forEach(([element, wasInert]) => { element.inert = wasInert; });
        backgroundState = [];
      }
    };

    const open = (event) => {
      event.preventDefault();
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : opener;
      zoomIndex = 1;
      applyZoom();
      if (scroll) { scroll.scrollTop = 0; scroll.scrollLeft = 0; }
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      setBackgroundInert(true);
      close?.focus({ preventScroll: true });
    };

    const dismiss = () => {
      if (!modal.classList.contains('active')) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      setBackgroundInert(false);
      returnFocus?.focus({ preventScroll: true });
    };

    const onKeydown = (event) => {
      if (!modal.classList.contains('active')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      } else if (event.key === 'Tab') {
        const focusable = queryAll(focusableSelector, panel).filter((element) => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    const onZoom = (delta) => {
      zoomIndex = Math.max(0, Math.min(levels.length - 1, zoomIndex + delta));
      applyZoom();
    };
    opener.addEventListener('click', open);
    close?.addEventListener('click', dismiss);
    backdrop?.addEventListener('click', dismiss);
    zoomOut?.addEventListener('click', () => onZoom(-1));
    zoomIn?.addEventListener('click', () => onZoom(1));
    zoomReset?.addEventListener('click', () => { zoomIndex = 1; applyZoom(); });
    image?.addEventListener('dblclick', () => { zoomIndex = zoomIndex === 1 ? 3 : 1; applyZoom(); });
    document.addEventListener('keydown', onKeydown);
    applyZoom();
    cleanup.push(() => {
      opener.removeEventListener('click', open);
      close?.removeEventListener('click', dismiss);
      backdrop?.removeEventListener('click', dismiss);
      document.removeEventListener('keydown', onKeydown);
      document.body.classList.remove('modal-open');
      setBackgroundInert(false);
    });
  }

  function loadEnhancements() {
    if (pageDisposed || reducedMotion.matches || !finePointer.matches) return Promise.resolve(false);

    if (enhancementLoaded) {
      initSmoothScroll();
      initHeroIntro();
      initThreeScene();
      return Promise.resolve(true);
    }
    if (enhancementPromise) return enhancementPromise;

    const gsapLoad = window.gsap
      ? (window.ScrollTrigger ? Promise.resolve(true) : loadScript('https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js'))
      : loadScript('https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js')
        .then((loaded) => loaded ? loadScript('https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js') : false);
    const lenisLoad = window.Lenis ? Promise.resolve(true) : loadScript('https://unpkg.com/lenis@1.3.27/dist/lenis.min.js');
    const threeLoad = window.THREE ? Promise.resolve(true) : loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');

    enhancementPromise = Promise.all([gsapLoad, lenisLoad, threeLoad]).then(() => {
      enhancementPromise = null;
      if (pageDisposed || reducedMotion.matches || !finePointer.matches) return false;

      gsap = window.gsap || null;
      scrollTrigger = window.ScrollTrigger || null;
      if (gsap && scrollTrigger) {
        try { gsap.registerPlugin(scrollTrigger); } catch { scrollTrigger = null; }
      }
      initSectionTriggers();
      initSmoothScroll();
      initHeroIntro();
      initThreeScene();
      enhancementLoaded = true;
      return true;
    });
    return enhancementPromise;
  }

  initCursor();
  initNavbar();
  initReveals();
  initCounters();
  initCardTilt();
  initMagneticButtons();
  initCvModal();

  const onMotionModeChange = () => {
    if (!reducedMotion.matches && finePointer.matches) loadEnhancements();
  };
  addListener(reducedMotion, 'change', onMotionModeChange);
  addListener(finePointer, 'change', onMotionModeChange);

  const dispose = () => {
    pageDisposed = true;
    cleanup.splice(0).reverse().forEach((disposeOne) => disposeOne());
  };
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) dispose();
  });
  loadEnhancements();
})();
