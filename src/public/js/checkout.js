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
    
    // Gomb letiltása
    submitButton.disabled = true;
    submitButton.textContent = 'Feldolgozás...';
    
    try {
      // Itt jöhet majd a tényleges szerver-oldali mentés
      // Egyelőre csak szimuláljuk
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Siker
      showSuccessMessage(formData);
      
      // Kosár törlése
      localStorage.removeItem('nexoraCart');
      localStorage.removeItem('nexoraCartCount');
      
      // Átirányítás 3 másodperc múlva
      setTimeout(() => {
        window.location.href = '/webshop';
      }, 3000);
      
    } catch (error) {
      console.error('Hiba a rendelés során:', error);
      showMessage('Hiba történt a rendelés során. Kérjük, próbáld újra!', 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Rendelés véglegesítése';
    }
  });
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
        <div style="width: 100%; height: 100%; background: #2ead2e; animation: progress 3s linear;"></div>
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
