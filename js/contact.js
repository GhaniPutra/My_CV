// Tunggu sampai seluruh konten halaman dimuat sebelum menjalankan kode
document.addEventListener("DOMContentLoaded", function () {
  // Ambil elemen form dengan ID "contact-form"
  const form = document.getElementById("contact-form");

  // Tambahkan event listener saat form disubmit
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Mencegah aksi default (form reload halaman)

    // Ambil semua data dari form
    const formData = new FormData(form);

    try {
      // Kirim data form ke endpoint Formspree menggunakan Fetch API
      const response = await fetch("https://formspree.io/f/mzzrqdjv", {
        method: "POST",             // Metode pengiriman POST
        body: formData,             // Data yang dikirim (berisi input form)
        headers: {
          Accept: "application/json" // Minta respon dalam format JSON
        }
      });

      // Jika respon dari server sukses (status 200 OK)
      if (response.ok) {
        showToast("✅ Pesan berhasil dikirim!"); // Tampilkan notifikasi sukses
        form.reset(); // Reset form setelah berhasil kirim
      } else {
        // Jika respon error tapi tidak dalam bentuk exception
        showToast("❌ Gagal mengirim pesan. Coba lagi.");
      }
    } catch (error) {
      // Tangkap jika terjadi error (misalnya koneksi gagal)
      showToast("⚠️ Terjadi error. Cek koneksi.");
    }
  });

  /**
   * Fungsi untuk menampilkan notifikasi sementara (toast)
   * @param {string} message - Pesan yang ingin ditampilkan
   */
  function showToast(message) {
    const container = document.getElementById("toast-container"); // Tempat menampilkan toast

    const toast = document.createElement("div"); // Buat elemen toast baru
    toast.textContent = message; // Masukkan pesan ke dalam elemen toast

    // Gaya CSS untuk tampilan toast
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "16px 24px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 8px 12pxrgb(0, 0, 0)";
    toast.style.fontSize = "12px";
    toast.style.fontWeight = "200";
    toast.style.textAlign = "center";
    toast.style.minWidth = "250px";
    toast.style.maxWidth = "90%";
    toast.style.opacity = "50%";
    toast.style.transition = "opacity 0.5s ease";

    container.appendChild(toast); // Tambahkan toast ke container

    // Efek fade-in (transparansi naik jadi penuh)
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 50);

    // Hapus toast setelah 1,5 detik
    setTimeout(() => {
      toast.style.opacity = "0"; // Fade-out
      setTimeout(() => {
        toast.remove(); // Hapus dari DOM
      }, 500);
    }, 1500);
  }
});
