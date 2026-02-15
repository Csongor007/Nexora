document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("floatingBtn");
  const overlay = document.getElementById("popupOverlay");

  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.style.display = "flex";
      renderPopup();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  }
});

function renderPopup() {
  // A window.loggedInUser változót a HTML-ben definiáljuk az EJS segítségével!
  if (!window.loggedInUser) {
    showLoginForm();
  } else {
    showUserProfile();
  }
}

function showLoginForm() {
  const popup = document.getElementById("popupContent");
  popup.innerHTML = `
        <h2 style="font-family: Orbitron, sans-serif; color: #0f0;">Bejelentkezés</h2>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 10px;">
            <input type="email" id="loginEmail" placeholder="Email cím" required style="padding: 10px; box-sizing: border-box; width: 100%;">
            <input type="password" id="loginPassword" placeholder="Jelszó" required style="padding: 10px; box-sizing: border-box; width: 100%;">
            <div id="loginError" style="color: red; display: none; font-family: Orbitron, sans-serif;"></div>
            <button type="submit" style="padding: 10px; background: #0f0; color: #000; border: none; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">Belépés</button>
        </form>
        <hr style="border-color: #0f0; margin: 20px 0;">
        <p style="font-family: Orbitron, sans-serif; color: #0f0;">Még nincs fiókod?</p>
        <button onclick="showRegisterForm()" style="padding: 10px; background: transparent; color: #0f0; border: 2px solid #0f0; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">Regisztráció</button>
    `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    handleAuth(
      "/login",
      {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value,
      },
      "loginError"
    );
  });
}

function showRegisterForm() {
  const popup = document.getElementById("popupContent");
  popup.innerHTML = `
        <h2 style="font-family: Orbitron, sans-serif; color: #0f0;">Regisztráció</h2>
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 10px;">
            <input type="text" id="registerNev" placeholder="Név" required style="padding: 10px; box-sizing: border-box; width: 100%;">
            <input type="email" id="registerEmail" placeholder="Email" required style="padding: 10px;box-sizing: border-box; width: 100%;">
            <input type="password" id="registerPassword" placeholder="Jelszó (min. 6 k.)" required minlength="6" style="padding: 10px;box-sizing: border-box; width: 100%;">
            <div id="registerError" style="color: red; display: none; font-family: Orbitron, sans-serif;"></div>
            <button type="submit" style="padding: 10px; background: #0f0; color: #000; border: none; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">Regisztráció</button><br>
        </form>
        <button onclick="showLoginForm()" style="padding: 10px; background: transparent; color: #0f0; border: 2px solid #0f0; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold;">Vissza a belépéshez</button>
    `;

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    handleAuth(
      "/register",
      {
        nev: document.getElementById("registerNev").value,
        email: encodeURIComponent(document.getElementById("registerEmail").value),
        password: document.getElementById("registerPassword").value,
      },
      "registerError"
    );
  });
}

async function handleAuth(url, body, errorId) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      window.location.reload();
    } else {
      const errDiv = document.getElementById(errorId);
      errDiv.textContent = data.error || "Hiba történt";
      errDiv.style.display = "block";
    }
  } catch (e) {
    console.error(e);
  }
}

function showUserProfile() {
  const popup = document.getElementById("popupContent");
  popup.innerHTML = `
        <h2 style="font-family: Orbitron, sans-serif; color: #0f0;">Fiók adatok</h2>
        <button onclick="downloadOrders()" style="padding: 12px; background: linear-gradient(135deg, #2ead2e 0%, #1e8c1e 100%); color: #fff; border: none; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold; margin-bottom: 15px; border-radius: 8px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(46, 173, 46, 0.4);">
            📄 Rendeléseim
        </button>
        <div style="font-family: Orbitron, sans-serif; color: #0f0; text-align: left; padding: 20px 0;">
            <p><strong>Név:</strong> ${window.loggedInUser.nev}</p>
            <p><strong>Email:</strong> ${window.loggedInUser.email}</p>
        </div>
        <button onclick="logout()" style="padding: 12px; background: #f00; color: #fff; border: none; width: 100%; cursor: pointer; font-family: Orbitron, sans-serif; font-weight: bold; border-radius: 8px; transition: all 0.3s;">Kijelentkezés</button>
    `;
}

async function downloadOrders() {
  try {
    // Letöltés indítása
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '⏳ Generálás...';
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';
    
    const response = await fetch('/orders/download', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Nem sikerült letölteni a rendeléseket');
    }
    
    // ZIP fájl letöltése
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexora_Rendelesek_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    button.disabled = false;
    button.textContent = originalText;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    
  } catch (error) {
    console.error('Hiba a letöltés során:', error);
    
    // Hibaüzenet megjelenítése a popup-ban
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'color: #ff3333; font-family: Orbitron, sans-serif; text-align: center; margin-top: 10px; font-size: 0.9rem;';
    errorDiv.textContent = '❌ ' + error.message;
    
    const popup = document.getElementById("popupContent");
    popup.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 3000);
    
    const button = event.target;
    button.disabled = false;
    button.textContent = '📄 Rendeléseim';
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  }
}

function logout() {
  window.location.href = "/logout";
}