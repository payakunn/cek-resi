const fetch = require('node-fetch');

// 🔑 DATA BOT
const TOKEN = "8882518836:AAHXM2HhRUzdfWg2l-4GLmCEF9bZpJnSR88";

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  
  try {
    const body = req.body;
    if (!body || !body.message) return res.status(200).json({ ok: true });

    const chatId = body.message.chat.id;
    const teks = body.message.text ? body.message.text.trim() : "";

    // 👋 Pesan Sambutan
    if (teks === "/start") {
      return res.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "👋 Halo! Selamat datang di Cek Resi Tracker Bot\n\nBot ini membantu kamu melacak resi secara langsung.\n\n🔍 Cara Penggunaan:\n• Kirim nomor resi untuk tracking detail\n• Kirim beberapa resi (pisahkan dengan koma/enter) untuk detail per resi\n\n📌 Contoh:\n123\n123, 456\n\nAda yang bisa saya bantu?"
      });
    }

    // 📦 Proses Cek Resi
    const daftarResi = teks.split(/[\n,;]+/).map(r => r.trim()).filter(r => r && /^[0-9a-zA-Z]+$/.test(r));
    
    if (daftarResi.length === 0) return res.status(200).json({ ok: true });

    for (const nomorResi of daftarResi) {
      try {
        // 🔍 Panggil API dari proyek Kakak sendiri
        const url = `https://cek-resi-fcxf.vercel.app/cek-resi/${nomorResi}`;
        const resApi = await fetch(url);
        const data = await resApi.json();

        if (data && data.status === 200 && data.data && data.data.valid) {
          const info = data.data;
          const ekspedisi = (info.expedisi || "-").toUpperCase();
          const statusKirim = info.status || "Sedang Diproses";
          const jenisLayanan = (info.serviceType || info.layanan || "NONCOD").toUpperCase();
          const infoCOD = jenisLayanan.includes("COD") ? "Ya" : "Tidak";
          const asal = info.pengirim?.alamatLengkap || info.pengirim?.kota || "-";
          const tujuan = info.penerima?.alamatLengkap || info.penerima?.kota || "-";

          // 📩 Format Tampilan
          let balasan = "";
          balasan += `📦 EXPEDISI : ${ekspedisi}\n`;
          balasan += `└ ${jenisLayanan}\n\n`;
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
              balasan += `${i+1}. ${item.tanggal || ""}\n   ${item.keterangan || ""}\n`;
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
            body: JSON.stringify({ chat_id: chatId, text: `❌ Resi: ${nomorResi}\nResi tidak ditemukan atau salah!` })
          });
        }
      } catch {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `⚠️ Resi: ${nomorResi}\nSedang gangguan, silakan coba lagi sebentar!` })
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
};
