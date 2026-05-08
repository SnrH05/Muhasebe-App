require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { printSlip } = require('./ingenicoService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Slip yazdırma endpoint'i
app.post('/api/print-slip', async (req, res) => {
  try {
    const orderData = req.body;
    // Eğer istekte posIp ve posPort varsa onları al, yoksa .env'deki varsayılanları kullan
    const targetIp = req.body.posIp || process.env.POS_IP || '192.168.1.50';
    const targetPort = parseInt(req.body.posPort || process.env.POS_PORT || '8888', 10);

    console.log('Slip yazdırma isteği alındı. Hedef:', targetIp, targetPort);

    const result = await printSlip(orderData, targetIp, targetPort);
    
    if (result.success) {
      res.json({ success: true, message: 'Slip başarıyla yazdırıldı.', data: result.data });
    } else {
      res.status(500).json({ success: false, message: 'Yazdırma hatası', error: result.error });
    }
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`POS Bridge servisi çalışıyor: http://localhost:${PORT}`);
  console.log(`Ingenico Hedef IP: ${process.env.POS_IP}:${process.env.POS_PORT}`);
});
