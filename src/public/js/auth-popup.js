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
            <input type="email" id="loginEmail" placeholder="Email cím" required style="padding: 10px; ...">
            <input type="password" id="loginPassword" placeholder="Jelszó" required style="padding: 10px; ...">
            <div id="loginError" style="color: red; display: none; font-family: Orbitron, sans-serif;"></div>
            <button type="submit" style="..."">Belépés</button>
        </form>
        <hr style="border-color: #0f0; margin: 20px 0;">
        <p style="font-family: Orbitron, sans-serif; color: #0f0;">Még nincs fiókod?</p>
        <button onclick="showRegisterForm()" style="..."">Regisztráció</button>
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
            <input type="text" id="registerNev" placeholder="Név" required style="padding: 10px; ...">
            <input type="email" id="registerEmail" placeholder="Email" required style="padding: 10px; ...">
            <input type="password" id="registerPassword" placeholder="Jelszó (min. 6 k.)" required minlength="6" style="padding: 10px; ...">
            <div id="registerError" style="color: red; display: none;"></div>
            <button type="submit" style="...">Regisztráció</button><br>
        </form>
        <button onclick="showLoginForm()" style="...">Vissza a belépéshez</button>
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
        <div style="font-family: Orbitron, sans-serif; color: #0f0; text-align: left; padding: 20px 0;">
            <p><strong>Név:</strong> ${window.loggedInUser.nev}</p>
            <p><strong>Email:</strong> ${window.loggedInUser.email}</p>
        </div>
        <button onclick="logout()" style="padding: 10px; background: #f00; color: #fff; border: none; width: 100%; cursor: pointer;">Kijelentkezés</button>
    `;
}

function logout() {
  window.location.href = "/logout";
}
