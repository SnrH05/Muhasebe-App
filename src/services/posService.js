// POS Bridge Servisi İletişim Katmanı

// Bridge servisinin adresi (Geliştirme ortamında genellikle localhost:3001)
// Bunu daha sonra ENV üzerinden alacak şekilde dinamikleştirebilirsiniz.
const BRIDGE_URL = 'http://localhost:3001/api/print-slip';

/**
 * Ödeme tamamlandıktan sonra fiş (slip) yazdırma isteği gönderir.
 * 
 * @param {Object} orderData 
 * @param {String} paymentType 'card' | 'cash'
 * @param {String} posIp
 * @param {String} posPort
 * @returns Promise<{success: boolean, message: string}>
 */
export const printSlipViaBridge = async (orderData, paymentType, posIp, posPort) => {
  try {
    const payload = {
      ...orderData,
      paymentType,
      posIp,
      posPort,
      printTime: new Date().toISOString()
    };

    const response = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Bridge Servisine ulaşılamadı:', error);
    return { 
      success: false, 
      message: 'Yazıcı servisine bağlanılamadı. Lütfen pos-bridge servisinin çalıştığından emin olun.',
      error: error.message 
    };
  }
};
