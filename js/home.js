
  // Isi teks yang ingin diketik, gunakan \n untuk baris baru
  const text = "Akmal Ghani\nWijaya Putra";
  const speed = 120;       // kecepatan ketik per karakter (ms)
  const delayAfterFinish = 2000; // jeda setelah selesai ketik (ms)
  const eraseSpeed = 50;   // kecepatan menghapus per karakter (ms)
  let i = 0;               // index karakter saat ini
  let typing = true;       // status mengetik (true) atau menghapus (false)

  const target = document.getElementById("typed-name");

  // Fungsi utama untuk animasi ketik dan hapus
  function typeEffectLoop() {
    if (!target) return;

    if (typing) {
      // Proses mengetik
      if (i < text.length) {
        let char = text.charAt(i);
        if (char === '\n') {
          target.innerHTML += "<br>"; // ganti \n dengan <br>
        } else {
          target.innerHTML += char;   // tambah karakter
        }
        i++;
        setTimeout(typeEffectLoop, speed); // lanjut ketik
      } else {
        typing = false; // selesai ketik, mulai hapus setelah delay
        setTimeout(typeEffectLoop, delayAfterFinish);
      }
    } else {
      // Proses menghapus
      if (i > 0) {
        let currentText = text.substring(0, i - 1); // ambil substring mundur
        target.innerHTML = currentText.replace(/\n/g, "<br>"); // ganti \n dengan <br>
        i--;
        setTimeout(typeEffectLoop, eraseSpeed); // lanjut hapus
      } else {
        typing = true; // setelah semua terhapus, ulangi mengetik
        setTimeout(typeEffectLoop, speed);
      }
    }
  }

  // Jalankan animasi saat halaman dimuat
  window.addEventListener("DOMContentLoaded", typeEffectLoop);