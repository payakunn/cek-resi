const fetch = require('node-fetch');

// 🔑 DATA BOT & API
const TOKEN = "8882518836:AAHXM2HhRUzdfWg2l-4GLmCEF9bZpJnSR88";
const API_KEY = "61acc933-f477-4982-ac7e-5061fb306a44";

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
        // 🔍 Panggil API dengan Key
        const url = `https://api.cekresi.com/v1/track?awb=${nomorResi}&api_key=${API_KEY}`;
        const resApi = await fetch(url);
        const data = await resApi.json();

        if (data.success === true && data.data) {
          const info = data.data;
          const ekspedisi = (info.courier || "").toUpperCase() || "-";
          const statusKirim = info.status || "Sedang Diproses";
          const layanan = info.service || "NONCOD";
          const infoCOD = info.cod ? "Ya" : "Tidak";
          const pengirimNama = info.origin?.name || "-";
          const pengirimAlamat = info.origin?.address || "-";
          const penerimaNama = info.destination?.name || "-";
          const penerimaAlamat = info.destination?.address || "-";

          // 📩 Format Tampilan
          let balasan = "";
          balasan += `📦 EXPEDISI : ${ekspedisi}\n`;
          balasan += `└ ${layanan}\n\n`;
          balasan += `📩 Resi\n`;
          balasan += `├ Service : ${layanan}\n`;
          balasan += `└ No Resi : ${nomorResi}\n\n`;
          balasan += `📮 Status\n`;
          balasan += `└ Status : ${statusKirim}\n\n`;
          balasan += `🚀 Pengirim\n`;
          balasan += `├ ${pengirimNama}\n`;
          balasan += `└ ${pengirimAlamat}\n\n`;
          balasan += `🚩 Penerima\n`;
          balasan += `├ ${penerimaNama}\n`;
          balasan += `└ ${penerimaAlamat}\n\n`;
          balasan += `⏩ POD Detail\n`;

          if (info.history && info.history.length > 0) {
            info.history.forEach((item, i) => {
              balasan += `${i+1}. ${item.date || ""}\n   ${item.desc || ""}\n`;
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
