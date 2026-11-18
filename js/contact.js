(() => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('formStatus');
  const submit = document.getElementById('submitBtn');
  const message = status?.querySelector('[data-status-message]') || status;
  if (!form || !status || !submit) return;

  let sending = false;
  let requestController = null;

  const locale = () => document.documentElement.lang === 'id' ? 'id' : 'en';
  const messages = {
    en: {
      sending: 'Sending your message…',
      sent: 'Message sent. Thank you for reaching out.',
      failed: 'The message could not be sent. Please try again.',
      network: 'Connection problem. Check your connection and try again.'
    },
    id: {
      sending: 'Pesan sedang dikirim…',
      sent: 'Pesan terkirim. Terima kasih sudah menghubungi saya.',
      failed: 'Pesan belum dapat dikirim. Silakan coba lagi.',
      network: 'Koneksi bermasalah. Periksa koneksi lalu coba lagi.'
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;

    sending = true;
    const language = locale();
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'sending';
    message.textContent = messages[language].sending;

    requestController = new AbortController();
    const timeout = window.setTimeout(() => requestController?.abort(), 15000);

    try {
      const response = await fetch('https://formspree.io/f/mzzrqdjv', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: requestController.signal
      });

      if (!response.ok) throw new Error('form-response');
      form.reset();
      status.dataset.state = 'success';
      message.textContent = messages[locale()].sent;
    } catch (error) {
      status.dataset.state = 'error';
      message.textContent = error.name === 'AbortError' || !navigator.onLine
        ? messages[locale()].network
        : messages[locale()].failed;
    } finally {
      window.clearTimeout(timeout);
      requestController = null;
      sending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });

  window.addEventListener('pagehide', () => requestController?.abort(), { once: true });
})();
