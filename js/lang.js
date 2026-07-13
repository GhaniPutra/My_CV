const translations = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_project: "Projects",
    nav_contact: "Contact",
    sys_init: "> INITIALIZING_PORTFOLIO.EXE",
    hero_greeting: "HI, I'M",
    hero_subtitle: "Crafting immersive digital experiences that merge art & technology.",
    hero_btn_cv: "Download CV",
    hero_btn_projects: "View Projects",
    stat_years: "Years Exp.",
    stat_skills: "Skills",
    stat_projects: "Projects",
    scroll_text: "SCROLL",
    about_bg: "ABOUT",
    about_title: "About Me",
    about_subtitle: "Learn more about me, my work, and the skills I currently use — with a strong focus on front-end development, web design, and visual storytelling.",
    about_intro: "I'm a <strong>Front-End Focused Web Developer</strong> with a passion for crafting visually stunning, user-friendly web experiences.",
    about_p1: "I specialize in building and designing the front-end of websites and web applications to ensure a seamless, engaging user experience. Check out my work in the Projects section.",
    about_p2: "Beyond web dev, I enjoy designing impactful PowerPoint presentations and sharing design knowledge — always open to collaborations in front-end, web, or presentation design.",
    projects_bg: "PROJECTS",
    projects_title: "My Projects",
    projects_subtitle: "Explore my creative work in front-end development & PowerPoint design. Each project reflects my commitment to delivering visually compelling, user-friendly results.",
    proj1_desc: "A university project highlighting Mount Telomoyo with a clean, responsive layout and smooth scroll animations using AOS. Built with HTML, CSS, and JavaScript.",
    proj1_btn: "Live Demo",
    proj2_desc: "A university assignment explaining routing, forwarding & flexible addressing in computer networks. Structured animations enhance clarity and engagement.",
    proj2_btn: "Download",
    contact_bg: "CONTACT",
    contact_title: "Contact Me",
    contact_subtitle: "Got a question or an idea to share? Drop a message below — I'll get back to you soon! Always open for front-end, web, or presentation design collaborations.",
    form_name: "Your Name",
    form_email: "Your Email",
    form_message: "Your Message",
    form_submit: "Send Message",
    footer_desc: "A Front-End Developer & Web Designer dedicated to building visually appealing, responsive, and user-centric web interfaces.",
    toggle_lang: "ID"
  },
  id: {
    nav_home: "Beranda",
    nav_about: "Tentang",
    nav_project: "Proyek",
    nav_contact: "Kontak",
    sys_init: "> MEMULAI_PORTOFOLIO.EXE",
    hero_greeting: "HALO, SAYA",
    hero_subtitle: "Menciptakan pengalaman digital imersif yang menggabungkan seni & teknologi.",
    hero_btn_cv: "Unduh CV",
    hero_btn_projects: "Lihat Proyek",
    stat_years: "Tahun Pengal.",
    stat_skills: "Keahlian",
    stat_projects: "Proyek",
    scroll_text: "GULIR",
    about_bg: "TENTANG",
    about_title: "Tentang Saya",
    about_subtitle: "Pelajari lebih lanjut tentang saya, karya saya, dan keahlian yang saya gunakan saat ini — dengan fokus kuat pada pengembangan front-end, desain web, dan penceritaan visual.",
    about_intro: "Saya seorang <strong>Web Developer Fokus Front-End</strong> yang bersemangat untuk menciptakan pengalaman web yang memukau secara visual dan ramah pengguna.",
    about_p1: "Saya berspesialisasi dalam membangun dan mendesain bagian front-end situs web dan aplikasi web untuk memastikan pengalaman pengguna yang mulus dan menarik. Lihat karya saya di bagian Proyek.",
    about_p2: "Selain pengembangan web, saya menikmati merancang presentasi PowerPoint yang berdampak dan berbagi pengetahuan desain — selalu terbuka untuk kolaborasi dalam front-end, web, atau desain presentasi.",
    projects_bg: "PROYEK",
    projects_title: "Proyek Saya",
    projects_subtitle: "Jelajahi karya kreatif saya dalam pengembangan front-end & desain PowerPoint. Setiap proyek mencerminkan komitmen saya untuk memberikan hasil yang menarik secara visual dan ramah pengguna.",
    proj1_desc: "Proyek universitas yang menyoroti Gunung Telomoyo dengan tata letak yang bersih, responsif, dan animasi gulir yang mulus menggunakan AOS. Dibangun dengan HTML, CSS, dan JavaScript.",
    proj1_btn: "Demo Langsung",
    proj2_desc: "Tugas universitas yang menjelaskan perutean, penerusan & pengalamatan fleksibel dalam jaringan komputer. Animasi terstruktur meningkatkan kejelasan dan keterlibatan.",
    proj2_btn: "Unduh",
    contact_bg: "KONTAK",
    contact_title: "Hubungi Saya",
    contact_subtitle: "Punya pertanyaan atau ide untuk dibagikan? Tinggalkan pesan di bawah ini — saya akan segera membalasnya! Selalu terbuka untuk kolaborasi front-end, web, atau desain presentasi.",
    form_name: "Nama Anda",
    form_email: "Email Anda",
    form_message: "Pesan Anda",
    form_submit: "Kirim Pesan",
    footer_desc: "Seorang Front-End Developer & Web Designer yang berdedikasi untuk membangun antarmuka web yang menarik secara visual, responsif, dan berpusat pada pengguna.",
    toggle_lang: "EN"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const langToggleBtn = document.getElementById('langToggle');
  if (!langToggleBtn) return;

  // Retrieve saved language from localStorage, or default to English
  let currentLang = localStorage.getItem('siteLang') || 'en';
  
  // Set initial text if needed
  updateLanguage(currentLang);

  langToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentLang = currentLang === 'en' ? 'id' : 'en';
    localStorage.setItem('siteLang', currentLang);
    updateLanguage(currentLang);
  });
});

function updateLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;

  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      // Special case for glitch text since it has data-text attribute
      if (el.classList.contains('glitch')) {
        el.setAttribute('data-text', dict[key]);
        const span = el.querySelector('span');
        if (span) span.innerHTML = dict[key];
      }
      // Special case for placeholders
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      }
      // Normal HTML replacement
      else {
        // Keep child SVGs or nested elements intact if needed, 
        // but for now we assume they are wrapped carefully in HTML 
        // or we just replace innerHTML. Let's try to replace the text node
        // or just innerHTML.
        
        // For buttons with SVG (Download CV, Live Demo)
        // Let's handle them by specifically wrapping text in a span in index.html,
        // or just re-inserting the SVG. Easiest is to wrap text in <span class="i18n-text"> in html,
        // and target that span with data-i18n instead of the button itself.
        el.innerHTML = dict[key];
      }
    }
  });

  // Update button text
  const langToggleBtn = document.getElementById('langToggle');
  if (langToggleBtn) {
    langToggleBtn.innerText = dict['toggle_lang'];
  }
}
