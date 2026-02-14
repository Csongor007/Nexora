// Checkout oldal JavaScript
document.addEventListener('DOMContentLoaded', () => {
  loadCartData();
  setupFormSubmit();
});

// Kosár adatok betöltése localStorage-ból
function loadCartData() {
  try {
    const cartItems = JSON.parse(localStorage.getItem('nexoraCart') || '[]');
    const cartSummary = document.getElementById('cartSummary');
    
    if (cartItems.length === 0) {
      // Ha üres a kosár, irányítsuk vissza a webshopba
      window.location.href = '/webshop';
      return;
    }
    
    // Termékek megjelenítése
    cartSummary.innerHTML = '';
    let subtotal = 0;
    
    cartItems.forEach(item => {
      subtotal += item.ar;
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <span class="cart-item-name">${item.nev}</span>
        <span class="cart-item-price">${item.ar.toLocaleString()} Ft</span>
      `;
      cartSummary.appendChild(itemDiv);
    });
    
    // Összegek kiszámítása
    const serviceFee = 990; // Rendszerhasználati díj
    const total = subtotal + serviceFee;
    
    // Összegek megjelenítése
    document.getElementById('subtotal').textContent = `${subtotal.toLocaleString()} Ft`;
    document.getElementById('serviceFee').textContent = `${serviceFee.toLocaleString()} Ft`;
    document.getElementById('total').textContent = `${total.toLocaleString()} Ft`;
    
  } catch (error) {
    console.error('Hiba a kosár betöltése közben:', error);
    window.location.href = '/webshop';
  }
}

// Form submit kezelése
function setupFormSubmit() {
  const submitButton = document.getElementById('submitOrder');
  const form = document.getElementById('checkoutForm');
  const termsCheckbox = document.getElementById('terms');
  
  submitButton.addEventListener('click', async () => {
    // Form validálás
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    if (!termsCheckbox.checked) {
      showMessage('Kérjük, fogadd el az ÁSZF-et!', 'error');
      return;
    }
    
    // Form adatok összegyűjtése
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      country: document.getElementById('country').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      zip: document.getElementById('zip').value,
      payment: document.querySelector('input[name="payment"]:checked').value,
      cartItems: JSON.parse(localStorage.getItem('nexoraCart') || '[]'),
      subtotal: document.getElementById('subtotal').textContent,
      serviceFee: document.getElementById('serviceFee').textContent,
      total: document.getElementById('total').textContent
    };
    
    // Fizetési mód alapján különböző ablak
    if (formData.payment === 'card') {
      showCardPaymentModal(formData);
    } else if (formData.payment === 'apple_pay') {
      showApplePayModal(formData);
    } else if (formData.payment === 'google_pay') {
      showGooglePayModal(formData);
    }
  });
}

// Bankkártyás fizetési ablak
function showCardPaymentModal(formData) {
  const overlay = document.createElement('div');
  overlay.id = 'paymentModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(51, 51, 51, 0.95);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 20px;
    border: 3px solid #2ead2e;
    max-width: 500px;
    width: 90%;
    color: white;
    font-family: Orbitron, sans-serif;
  `;
  
  modal.innerHTML = `
    <h2 style="color: #2ead2e; margin-bottom: 25px; text-align: center;">💳 Bankkártyás fizetés</h2>
    
    <div style="margin-bottom: 20px;">
      <p style="color: #ccc; margin-bottom: 10px; font-size: 0.9rem;">Fizetendő összeg:</p>
      <p style="color: #2ead2e; font-size: 1.5rem; font-weight: bold; text-align: center;">${formData.total}</p>
    </div>
    
    <form id="cardForm" style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 5px;">Kártyaszám *</label>
        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required
               style="width: 100%; padding: 12px; background: rgba(20, 20, 20, 0.8); border: 2px solid rgba(46, 173, 46, 0.5); border-radius: 8px; color: white; font-family: Orbitron, sans-serif; box-sizing: border-box;">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 5px;">Lejárat *</label>
          <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5" required
                 style="width: 100%; padding: 12px; background: rgba(20, 20, 20, 0.8); border: 2px solid rgba(46, 173, 46, 0.5); border-radius: 8px; color: white; font-family: Orbitron, sans-serif; box-sizing: border-box;">
        </div>
        <div>
          <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 5px;">CVV *</label>
          <input type="text" id="cardCVV" placeholder="123" maxlength="3" required
                 style="width: 100%; padding: 12px; background: rgba(20, 20, 20, 0.8); border: 2px solid rgba(46, 173, 46, 0.5); border-radius: 8px; color: white; font-family: Orbitron, sans-serif; box-sizing: border-box;">
        </div>
      </div>
      
      <div>
        <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 5px;">Kártyabirtokos neve *</label>
        <input type="text" id="cardName" placeholder="KOVÁCS JÁNOS" required
               style="width: 100%; padding: 12px; background: rgba(20, 20, 20, 0.8); border: 2px solid rgba(46, 173, 46, 0.5); border-radius: 8px; color: white; font-family: Orbitron, sans-serif; box-sizing: border-box;">
      </div>
      
      <p style="color: #888; font-size: 0.75rem; text-align: center; margin-top: 10px;">
        🔒 A kártyaadatokat nem tároljuk, biztonságos kapcsolaton keresztül kerülnek feldolgozásra.
      </p>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button type="button" onclick="closePaymentModal()" 
                style="flex: 1; padding: 14px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
          Mégse
        </button>
        <button type="submit" id="cardPayButton"
                style="flex: 1; padding: 14px; background: #2ead2e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
          Fizetés
        </button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Kártyaszám formázás
  document.getElementById('cardNumber').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
  });
  
  // Lejárat formázás
  document.getElementById('cardExpiry').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  });
  
  // CVV csak számok
  document.getElementById('cardCVV').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
  
  // Form submit
  document.getElementById('cardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validáció
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;
    
    if (cardNumber.length !== 16 || cardCVV.length !== 3 || !cardExpiry.includes('/')) {
      showMessage('Kérjük, adj meg érvényes kártyaadatokat!', 'error');
      return;
    }
    
    // Fizetés gomb letiltása
    const payButton = document.getElementById('cardPayButton');
    payButton.disabled = true;
    payButton.textContent = 'Feldolgozás...';
    
    // Rendelés leadása
    await processOrder(formData);
  });
}

// Apple Pay ablak
function showApplePayModal(formData) {
  const overlay = document.createElement('div');
  overlay.id = 'paymentModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(51, 51, 51, 0.95);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 20px;
    border: 3px solid #2ead2e;
    max-width: 450px;
    width: 90%;
    color: white;
    font-family: Orbitron, sans-serif;
    text-align: center;
  `;
  
  modal.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; height: 4rem;">
      <img src="/img/icons/apple.svg" alt="Apple Pay" style="height: 4rem; width: auto; object-fit: contain;">
    </div>
    <h2 style="color: #2ead2e; margin-bottom: 20px;">Apple Pay fizetés</h2>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #ccc; margin-bottom: 10px;">Fizetendő összeg:</p>
      <p style="color: #2ead2e; font-size: 1.8rem; font-weight: bold;">${formData.total}</p>
    </div>
    
    <p style="color: #ccc; margin-bottom: 30px; font-size: 0.95rem;">
      Erősítsd meg a fizetést az eszközöd Touch ID vagy Face ID funkciójával.
    </p>
    
    <div style="display: flex; gap: 10px;">
      <button onclick="closePaymentModal()" 
              style="flex: 1; padding: 14px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
        Mégse
      </button>
      <button onclick="confirmApplePay()" id="applePayButton"
              style="flex: 1; padding: 14px; background: #2ead2e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
         Megerősítés
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Apple Pay megerősítés
  window.confirmApplePay = async () => {
    const button = document.getElementById('applePayButton');
    button.disabled = true;
    button.textContent = 'Feldolgozás...';
    await processOrder(formData);
  };
}

// Google Pay ablak
function showGooglePayModal(formData) {
  const overlay = document.createElement('div');
  overlay.id = 'paymentModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(51, 51, 51, 0.95);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 20px;
    border: 3px solid #2ead2e;
    max-width: 450px;
    width: 90%;
    color: white;
    font-family: Orbitron, sans-serif;
    text-align: center;
  `;
  
  modal.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 20px;">🅖</div>
    <h2 style="color: #2ead2e; margin-bottom: 20px;">Google Pay fizetés</h2>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #ccc; margin-bottom: 10px;">Fizetendő összeg:</p>
      <p style="color: #2ead2e; font-size: 1.8rem; font-weight: bold;">${formData.total}</p>
    </div>
    
    <p style="color: #ccc; margin-bottom: 30px; font-size: 0.95rem;">
      Erősítsd meg a fizetést a Google Pay alkalmazásodban.
    </p>
    
    <div style="display: flex; gap: 10px;">
      <button onclick="closePaymentModal()" 
              style="flex: 1; padding: 14px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
        Mégse
      </button>
      <button onclick="confirmGooglePay()" id="googlePayButton"
              style="flex: 1; padding: 14px; background: #2ead2e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
        🅖 Megerősítés
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Google Pay megerősítés
  window.confirmGooglePay = async () => {
    const button = document.getElementById('googlePayButton');
    button.disabled = true;
    button.textContent = 'Feldolgozás...';
    await processOrder(formData);
  };
}

// Fizetési modal bezárása
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.remove();
  }
}

// Rendelés feldolgozása - szerver hívás
async function processOrder(formData) {
  try {
    const response = await fetch('/order/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Fizetési modal bezárása
      closePaymentModal();
      
      // Siker üzenet
      showSuccessMessage(formData);
      
      // Kosár törlése
      localStorage.removeItem('nexoraCart');
      localStorage.removeItem('nexoraCartCount');
      
      // Átirányítás 10 másodperc múlva
      setTimeout(() => {
        window.location.href = '/webshop';
      }, 10000);
    } else {
      throw new Error(data.error || 'Ismeretlen hiba történt');
    }
  } catch (error) {
    console.error('Rendelés hiba:', error);
    closePaymentModal();
    showMessage('Hiba történt a rendelés során: ' + error.message, 'error');
    
    // Gomb újra engedélyezése
    const submitButton = document.getElementById('submitOrder');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Rendelés véglegesítése';
    }
  }
}

// Üzenet megjelenítése
function showMessage(message, type = 'info') {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(51, 51, 51, 0.95);
    backdrop-filter: blur(10px);
    padding: 30px;
    border-radius: 20px;
    border: 3px solid ${type === 'error' ? '#ff3333' : '#2ead2e'};
    max-width: 400px;
    width: 90%;
    text-align: center;
    color: white;
    font-family: Orbitron, sans-serif;
  `;
  
  modal.innerHTML = `
    <h2 style="color: ${type === 'error' ? '#ff3333' : '#2ead2e'}; margin-bottom: 15px;">
      ${type === 'error' ? '❌ Hiba' : 'ℹ️ Figyelem'}
    </h2>
    <p style="margin-bottom: 20px;">${message}</p>
    <button onclick="this.parentElement.parentElement.remove()" 
            style="padding: 12px 30px; background: ${type === 'error' ? '#ff3333' : '#2ead2e'}; 
                   color: white; border: none; border-radius: 8px; cursor: pointer; 
                   font-family: Orbitron, sans-serif; font-weight: bold;">
      Rendben
    </button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
}

// Sikeres rendelés üzenet
function showSuccessMessage(formData) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(51, 51, 51, 0.95);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 20px;
    border: 3px solid #2ead2e;
    max-width: 500px;
    width: 90%;
    text-align: center;
    color: white;
    font-family: Orbitron, sans-serif;
    box-shadow: 0 0 40px rgba(46, 173, 46, 0.5);
  `;
  
  modal.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
    <h2 style="color: #2ead2e; margin-bottom: 20px; font-size: 1.8rem;">
      Sikeres rendelés!
    </h2>
    <p style="margin-bottom: 15px; font-size: 1.1rem;">
      Köszönjük a megrendelést, <strong>${formData.name}</strong>!
    </p>
    <p style="margin-bottom: 10px; color: #ccc;">
      Az aktivációs kulcsokat hamarosan megkapod a következő email címre:
    </p>
    <p style="color: #2ead2e; font-weight: bold; margin-bottom: 20px;">
      ${formData.email}
    </p>
    <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">
      Kérjük, ellenőrizd a spam mappát is!
    </p>
    <p style="color: #ccc; font-size: 0.9rem;">
      Átirányítunk a webshopba...
    </p>
    <div style="margin-top: 20px;">
      <div style="width: 100%; height: 4px; background: rgba(46, 173, 46, 0.2); border-radius: 2px; overflow: hidden;">
        <div style="width: 100%; height: 100%; background: #2ead2e; animation: progress 10s linear;"></div>
      </div>
    </div>
  `;
  
  // Progress bar animáció
  const style = document.createElement('style');
  style.textContent = `
    @keyframes progress {
      from { width: 0%; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(style);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}