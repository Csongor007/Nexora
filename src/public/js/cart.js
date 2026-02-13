// Kosár kezelés - Nexora Webshop
let cartCount = 0;
const MAX_ITEMS = 10;
const cartItems = []; // Termékek tárolása

// Inicializálás
function initCart() {
  // Kosár gomb létrehozása ha még nincs
  if (!document.getElementById('cartButton')) {
    createCartButton();
  }
  
  // Figyelmeztetés div létrehozása
  if (!document.getElementById('cartWarning')) {
    createWarningDiv();
  }
  
  // Kosár betöltése localStorage-ből
  loadCartFromStorage();
  updateCartBadge();
}

// Kosár gomb létrehozása
function createCartButton() {
  const cartButton = document.createElement('button');
  cartButton.id = 'cartButton';
  cartButton.className = 'cart-button';
  cartButton.onclick = showCart;
  cartButton.innerHTML = `
    🛒
    <span class="cart-badge" id="cartBadge">0</span>
  `;
  document.body.appendChild(cartButton);
}

// Figyelmeztetés div létrehozása
function createWarningDiv() {
  const warning = document.createElement('div');
  warning.id = 'cartWarning';
  warning.className = 'cart-warning';
  warning.textContent = 'Elérted a maximum 10 terméket!🛑';
  document.body.appendChild(warning);
}

// Termék hozzáadása a kosárhoz
function addToCart(button, termekData) {
  if (cartCount >= MAX_ITEMS) {
    showWarning();
    return false;
  }

  cartCount++;
  cartItems.push(termekData);
  
  // localStorage-ba mentés
  saveCartToStorage();
  
  // Badge frissítése
  updateCartBadge();
  
  // Gomb vizuális visszajelzés
  const originalText = button.innerHTML;
  const originalBg = button.style.backgroundColor;
  
  button.innerHTML = '✓ Hozzáadva';
  button.style.backgroundColor = 'rgba(46, 173, 46, 1)';
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.backgroundColor = originalBg;
  }, 1000);

  // Ha elérte a maximumot, tiltsd le az összes gombot
  if (cartCount >= MAX_ITEMS) {
    disableAllCartButtons();
    showWarning();
  }
  
  return true;
}

// Badge frissítése
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  
  badge.textContent = cartCount;
  
  if (cartCount > 0) {
    badge.classList.add('show');
    badge.classList.add('pulse');
    setTimeout(() => badge.classList.remove('pulse'), 500);
  } else {
    badge.classList.remove('show');
  }
}

// Figyelmeztetés megjelenítése
function showWarning() {
  const warning = document.getElementById('cartWarning');
  if (!warning) return;
  
  warning.classList.add('show');
  setTimeout(() => {
    warning.classList.remove('show');
  }, 3000);
}

// Összes kosár gomb letiltása
function disableAllCartButtons() {
  const buttons = document.querySelectorAll('.kosar-gomb');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = '🛑 Kosár tele';
  });
}

// Kosár gomb engedélyezése újra (ha töröltünk a kosárból)
function enableAllCartButtons() {
  const buttons = document.querySelectorAll('.kosar-gomb');
  buttons.forEach(btn => {
    btn.disabled = false;
    btn.innerHTML = 'Kosárba🛒';
  });
}

// Kosár megjelenítése
function showCart() {
  if (cartCount === 0) {
    showCartModal('A kosár üres! 🛒', 'Kezdj el vásárolni!');
    return;
  }

  // Termékek listázása
  let productList = '<div style="max-height: 400px; overflow-y: auto;">';
  let totalPrice = 0;
  
  cartItems.forEach((item, index) => {
    totalPrice += item.ar;
    productList += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 10px; background: rgba(46, 173, 46, 0.1); border-radius: 8px; border: 1px solid rgba(46, 173, 46, 0.3);">
        <div style="flex: 1;">
          <strong>${item.nev}</strong><br>
          <span style="color: #2ead2e;">${item.ar.toLocaleString()} Ft</span>
        </div>
        <button onclick="removeFromCart(${index})" style="background: #ff3333; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
          Törlés
        </button>
      </div>
    `;
  });
  
  productList += '</div>';
  
  const cartContent = `
    <h2 style="color: #2ead2e; margin-bottom: 20px;">Kosár tartalma (${cartCount}/10)</h2>
    ${productList}
    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid rgba(46, 173, 46, 0.5);">
      <h3 style="color: white;">Összesen: <span style="color: #2ead2e;">${totalPrice.toLocaleString()} Ft</span></h3>
      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button onclick="closeCartModal()" style="flex: 1; padding: 12px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
          Bezárás
        </button>
        <button onclick="checkout()" style="flex: 1; padding: 12px; background: #2ead2e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
          Fizetés
        </button>
      </div>
    </div>
  `;
  
  showCartModal('', cartContent);
}

// Termék eltávolítása a kosárból
function removeFromCart(index) {
  cartItems.splice(index, 1);
  cartCount--;
  
  saveCartToStorage();
  updateCartBadge();
  
  // Ha már nincs tele, engedélyezd újra a gombokat
  if (cartCount < MAX_ITEMS) {
    enableAllCartButtons();
  }
  
  // Frissítsd a kosár nézetet
  if (cartCount === 0) {
    closeCartModal();
  } else {
    showCart();
  }
}

// Kosár modal megjelenítése
function showCartModal(title, content) {
  // Töröld a régi modalt ha van
  const existingModal = document.getElementById('cartModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'cartModal';
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
    border: 3px solid rgb(46, 173, 46);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    text-align: center;
    color: white;
    font-family: Orbitron, sans-serif;
  `;
  
  modal.innerHTML = title ? 
    `<h2 style="color: #2ead2e; margin-bottom: 15px;">${title}</h2><p>${content}</p>` : content;
  
  overlay.appendChild(modal);
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeCartModal();
    }
  };
  
  document.body.appendChild(overlay);
}

// Modal bezárása
function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.remove();
  }
}

// Fizetés folyamat - ELLENŐRZI A BEJELENTKEZÉST!
function checkout() {
  if (cartCount === 0) return;
  
  // Bejelentkezés ellenőrzése - a window.loggedInUser változót az EJS állítja be
  if (!window.loggedInUser) {
    // Ha nincs bejelentkezve, figyelmeztetés
    closeCartModal();
    
    showCartModal(
      '⚠️ Bejelentkezés szükséges', 
      `<p style="margin-bottom: 20px;">A rendelés véglegesítéséhez be kell jelentkezned!</p>
       <p style="margin-bottom: 20px; color: #ccc;">Kérjük, jelentkezz be vagy regisztrálj, hogy folytathasd a vásárlást.</p>
       <button onclick="closeCartModal(); document.getElementById('floatingBtn').click();" 
               style="padding: 12px 30px; background: #2ead2e; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold; margin-right: 10px;">
         Bejelentkezés
       </button>
       <button onclick="closeCartModal()" 
               style="padding: 12px 30px; background: #555; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">
         Mégse
       </button>`
    );
    return;
  }
  
  // Ha be van jelentkezve, átirányítás a checkout oldalra
  window.location.href = '/checkout';
}

// localStorage kezelés
function saveCartToStorage() {
  try {
    localStorage.setItem('nexoraCart', JSON.stringify(cartItems));
    localStorage.setItem('nexoraCartCount', cartCount);
  } catch (e) {
    console.error('Nem sikerült menteni a kosarat:', e);
  }
}

function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('nexoraCart');
    const savedCount = localStorage.getItem('nexoraCartCount');
    
    if (savedCart && savedCount) {
      cartItems.length = 0; // Töröld a tömböt
      cartItems.push(...JSON.parse(savedCart));
      cartCount = parseInt(savedCount);
      
      // Ha tele van, tiltsd le a gombokat
      if (cartCount >= MAX_ITEMS) {
        // Kis késleltetés, hogy a gombok már létezzenek
        setTimeout(() => {
          disableAllCartButtons();
        }, 500);
      }
    }
  } catch (e) {
    console.error('Nem sikerült betölteni a kosarat:', e);
  }
}

// Kosár törlése
function clearCart() {
  cartItems.length = 0;
  cartCount = 0;
  saveCartToStorage();
  updateCartBadge();
  enableAllCartButtons();
}

// Inicializálás amikor betölt az oldal
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCart);
} else {
  initCart();
}
