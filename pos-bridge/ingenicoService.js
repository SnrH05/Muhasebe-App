const net = require('net');
require('dotenv').config();

// Varsayılanlar artık fonksiyona parametre olarak gelecek


/**
 * Sipariş verisini Ingenico'nun anlayacağı basit bir metin formatına çevirir.
 * Protokol dökümantasyonu olmadığı için ilk aşamada şablon metin gönderiyoruz.
 */
function formatSlipData(orderData) {
  // Örnek bir XML veya metin şablonu (Cihazın ECR protokolüne göre bu yapının değişmesi gerekecektir)
  // Şimdilik cihazın loglarını görebilmek adına plain text gönderiyoruz.
  let slip = `----- MUHASEBE POS -----\n`;
  slip += `Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
  slip += `Masa: ${orderData.tableName || 'N/A'}\n`;
  slip += `Garson: ${orderData.waiter || 'N/A'}\n`;
  slip += `------------------------\n`;
  
  if (orderData.items && Array.isArray(orderData.items)) {
    orderData.items.forEach(item => {
      slip += `${item.quantity}x ${item.name} - ${item.price} TL\n`;
    });
  }
  
  slip += `------------------------\n`;
  slip += `TOPLAM: ${orderData.totalAmount} TL\n`;
  slip += `Ödeme Tipi: ${orderData.paymentType === 'card' ? 'KREDİ KARTI' : 'NAKİT'}\n`;
  slip += `------------------------\n`;
  
  // TCP protokollerinde genelde ETX veya null byte ile sonlandırma gerekir.
  // Bu kısmı cihazın dokümantasyonuna göre (Örn: [STX] DATA [ETX] [LRC]) revize edeceğiz.
  return slip + '\x03'; // Örnek End of Text (ETX)
}

/**
 * TCP Soket üzerinden cihaza bağlanıp veriyi iletir.
 */
function printSlip(orderData, targetIp, targetPort) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    const slipData = formatSlipData(orderData);

    client.setTimeout(5000); // 5 saniye zaman aşımı

    console.log(`POS Cihazına Bağlanılıyor... (${targetIp}:${targetPort})`);

    client.connect(targetPort, targetIp, () => {
      console.log('POS cihazına bağlantı başarılı. Veri gönderiliyor...');
      client.write(slipData);
    });

    client.on('data', (data) => {
      console.log('POS Cihazından Yanıt:', data.toString());
      client.destroy(); // Yanıt alınca bağlantıyı kapat
      resolve({ success: true, data: data.toString() });
    });

    client.on('error', (err) => {
      console.error('POS Bağlantı Hatası:', err.message);
      client.destroy();
      resolve({ success: false, error: err.message });
    });

    client.on('timeout', () => {
      console.error('POS Bağlantısı Zaman Aşımına Uğradı.');
      client.destroy();
      resolve({ success: false, error: 'Connection Timeout' });
    });
  });
}

module.exports = {
  printSlip,
};
