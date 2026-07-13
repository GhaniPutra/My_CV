/* ============================================================
   MAIN.JS — Retro-Futuristic Portfolio Interactions
   - Custom cursor
   - Particle canvas (floating neon dots)
   - Navbar scroll behaviour & active section tracking
   - Counter-up animation
   - Stats & general micro-animations
   - Year in footer
   ============================================================ */

// ── UTILITIES ─────────────────────────────────────────────
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// ── YEAR ──────────────────────────────────────────────────
const yearEl = qs('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── CUSTOM CURSOR ─────────────────────────────────────────
(function initCursor() {
  const dot  = qs('#cursorDot');
  const ring = qs('#cursorRing');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  const LERP = 0.12;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Smooth ring lag
  function animRing() {
    ringX += (mouseX - ringX) * LERP;
    ringY += (mouseY - ringY) * LERP;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  // Hover scale on interactive elements
  const interactiveSelector = 'a, button, .tag, .project-card, .social-link, .nav-link, [tabindex]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveSelector)) ring.classList.add('hovering');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveSelector)) ring.classList.remove('hovering');
  });
})();

// ── THREE.JS CANVAS ───────────────────────────────────────
(function initThreeJS() {
  const canvas = qs('#threeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create a stunning wireframe geometry (Torus Knot)
  const geometry = new THREE.TorusKnotGeometry(12, 3, 150, 20);
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00FFFF, 
    wireframe: true,
    transparent: true,
    opacity: 0.08
  });
  const torusKnot = new THREE.Mesh(geometry, material);
  scene.add(torusKnot);

  // Add floating particles/stars in 3D
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 400;
  const posArray = new Float32Array(particlesCount * 3);
  const colorsArray = new Float32Array(particlesCount * 3);
  
  const colorPalette = [
    new THREE.Color(0x00FFFF), // cyan
    new THREE.Color(0xFF006E), // pink
    new THREE.Color(0xB945FF), // purple
    new THREE.Color(0x05FFA1)  // green
  ];

  for(let i = 0; i < particlesCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 120;
    posArray[i+1] = (Math.random() - 0.5) * 120;
    posArray[i+2] = (Math.random() - 0.5) * 120;
    
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colorsArray[i] = color.r;
    colorsArray[i+1] = color.g;
    colorsArray[i+2] = color.b;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.001;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Subtle rotation of Torus Knot
    torusKnot.rotation.y = elapsedTime * 0.15;
    torusKnot.rotation.x = elapsedTime * 0.1;
    
    // Slow color shifting for Torus Knot
    // Hue from 0.5 (cyan) to 0.8 (pink/purple)
    const hue = Math.abs(Math.sin(elapsedTime * 0.05)) * 0.3 + 0.5;
    material.color.setHSL(hue, 1, 0.5);

    // Particles subtle movement
    particlesMesh.rotation.y = -elapsedTime * 0.03;

    // Mouse parallax effect
    targetX = mouseX * 3;
    targetY = mouseY * 3;
    
    camera.position.x += 0.05 * (targetX - camera.position.x);
    camera.position.y += 0.05 * (-targetY - camera.position.y);
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();
})();

// ── NAVBAR ────────────────────────────────────────────────
(function initNavbar() {
  const navbar  = qs('.navbar');
  const toggle  = qs('#navToggle');
  const menu    = qs('#navMenu');
  const navLinks = qsa('.nav-link');

  // Scroll class
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Mobile toggle
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Active section tracking
  const sections = qsa('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = qs(`.nav-link[data-section="${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));

  // Close menu on link click (mobile)
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menu && menu.classList.remove('open');
      toggle && toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ── COUNTER-UP ANIMATION ──────────────────────────────────
(function initCounters() {
  const counters = qsa('.stat-number');
  if (!counters.length) return;

  const countObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current  = 0;
      const step   = Math.ceil(target / 40);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + '+';
        if (current >= target) {
          el.textContent = target + '+';
          clearInterval(timer);
        }
      }, 40);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => countObs.observe(c));
})();

// ── CARD TILT EFFECT ─────────────────────────────────────
(function initCardTilt() {
  const cards = qsa('.project-card, .about-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width  / 2;
      const centerY = rect.height / 2;
      // Increased rotation mapping for deeper 3D effect
      const rotateY = ((x - centerX) / centerX) * 12;
      const rotateX = -((y - centerY) / centerY) * 12;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// ── SIMPLE AOS (Animate On Scroll) ───────────────────────
(function initAOS() {
  const elements = qsa('[data-aos]');
  if (!elements.length) return;

  const style = document.createElement('style');
  style.textContent = `
    [data-aos] {
      opacity: 0;
      transition: opacity 600ms ease, transform 600ms ease;
    }
    [data-aos="fade-up"]    { transform: translateY(40px); }
    [data-aos="fade-right"] { transform: translateX(-40px); }
    [data-aos="fade-left"]  { transform: translateX(40px); }
    [data-aos].aos-animate  { opacity: 1; transform: translate(0,0); }
  `;
  document.head.appendChild(style);

  const aosObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.aosDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, parseInt(delay));
        aosObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => aosObs.observe(el));
})();

// ── GLITCH BURST on hero click ────────────────────────────
(function initGlitchBurst() {
  const glitchEl = qs('.glitch');
  if (!glitchEl) return;
  glitchEl.addEventListener('click', () => {
    glitchEl.style.animation = 'none';
    glitchEl.style.transform = 'skewX(-5deg)';
    setTimeout(() => {
      glitchEl.style.transform = '';
    }, 150);
  });
})();
