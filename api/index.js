const fetch = require('node-fetch');

// 🔑 GANTI DENGAN TOKEN BOT KAKAK DARI @BotFather
const TOKEN = "8882518836:AAHXM2HhRUzdfWg2l-4GLmCEF9bZpJnSR88";

// 🌐 Alamat API Cek Resi Kakak
const API_CEK_RESI = "https://cek-resi-liard.vercel.app/cek-resi/";

module.exports = async (req, res) => {
  try {
    const body = req.body;
    const chatId = body.message.chat.id;
    const teks = body.message.text?.trim();

    if (!teks) return res.sendStatus(200);

    // 👋 PESAN SAMBUTAN — LENGKAP PERSIS
    if (teks === "/start") {
      return res.json({
        method: "sendMessage",
        chat_id: chatId,
        text: `👋 Halo! Selamat datang di Cek Resi Tracker Bot

Bot ini membantu kamu melacak resi secara langsung.

🔍 Cara Penggunaan:
• Kirim nomor resi untuk tracking detail
• Kirim beberapa resi (pisahkan dengan koma/enter) untuk detail per resi

📌 Contoh:
123
123, 456

📦 Info yang Ditampilkan:
• Status pengiriman (Bahasa Indonesia)
• Info COD (Ya/Tidak)
• Asal & Tujuan
• Riwayat tracking terbaru

Ada yang bisa saya bantu?`
      });
    }

    // 📦 PROSES CEK RESI — FORMAT TAMPILAN PERMINTAAN KAKAK
    const daftarResi = teks.split(/[\n,;]+/).map(r => r.trim()).filter(r => /^[0-9]+$/.test(r));

    if (daftarResi.length === 0) return res.sendStatus(200);

    for (const nomorResi of daftarResi) {
      try {
        const data = await (await fetch(API_CEK_RESI + nomorResi)).json();

        if (data.status === 200 && data.data?.valid) {
          const info = data.data;

          // ✅ TENTUKAN INFO COD
          const jenisLayanan = (info.serviceType || info.service || "NONCOD").toUpperCase();
          const infoCOD = jenisLayanan.includes("COD") ? "Ya" : "Tidak";

          // ✅ AMBIL ASAL & TUJUAN
          const asal = info.pengirim?.alamatLengkap || info.pengirim?.kota || "-";
          const tujuan = info.penerima?.alamatLengkap || info.penerima?.kota || "-";

          // ✅ STATUS BAHASA INDONESIA
          let statusKirim = info.status || "Sedang Diproses";

          // 📩 FORMAT TAMPILAN PERSIS KAKAK INGINKAN
          let balasan = "";
          balasan += `📦 EXPEDISI : ${info.expedisi || "J&T"}\n`;
          balasan += `└ ${info.layanan || "REGULER"}\n\n`;

          balasan += `📩 Resi\n`;
          balasan += `├ Service : ${jenisLayanan}\n`;
          balasan += `└ No Resi : ${nomorResi}\n\n`;

          balasan += `📮 Status\n`;
          balasan += `└ Status : ${statusKirim}\n\n`;

          balasan += `🚀 Pengirim\n`;
          balasan += `├ ${info.pengirim?.nama || "-"}\n`;
          balasan += `└ ${asal}\n\n`;

          balasan += `🚩 Penerima\n`;
          balasan += `├ ${info.penerima?.nama || "-"}\n`;
          balasan += `└ ${tujuan}\n\n`;

          balasan += `⏩ POD Detail\n`;
          if (info.perjalanan && info.perjalanan.length > 0) {
            info.perjalanan.forEach((item, i) => {
              balasan += `${i+1}. ${item.tanggal}\n   ${item.keterangan}\n`;
            });
          } else {
            balasan += `Belum ada riwayat perjalanan\n`;
          }

          balasan += `\n💡 Info COD : ${infoCOD}`;

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: balasan })
          });

        } else {
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ Resi: ${nomorResi}\nResi tidak ditemukan. Pastikan nomor resi benar ya!`
            })
          });
        }
      } catch {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `⚠️ Resi: ${nomorResi}\nSedang gangguan, silakan coba lagi sebentar!`
          })
        });
      }
    }

    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
};
