// contact-handler.js
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm");
  const subjectTextarea = document.getElementById("subject");
  const charCounter = document.getElementById("charCounter");

  // Karakter számláló
  if (subjectTextarea && charCounter) {
    const updateCounter = () => {
      const remaining = 300 - subjectTextarea.value.length;
      charCounter.textContent = `${subjectTextarea.value.length} / 300 karakter`;
      charCounter.style.color = remaining < 50 ? "#f00" : "#0f0";
    };

    subjectTextarea.addEventListener("input", updateCounter);
    updateCounter();
  }

  // Form submit kezelése
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const subject = document.getElementById("subject").value.trim();

      // Validáció frontend oldalon
      if (!name || !email || !subject) {
        showNotification("Kérjük töltsd ki az összes mezőt!", "error");
        return;
      }

      if (name.length > 50) {
        showNotification("A név maximum 50 karakter lehet!", "error");
        return;
      }

      if (email.length > 50) {
        showNotification("Az email cím maximum 50 karakter lehet!", "error");
        return;
      }

      if (subject.length > 300) {
        showNotification("Az üzenet maximum 300 karakter lehet!", "error");
        return;
      }

      // Email formátum validáció
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNotification("Kérjük, érvényes email címet adj meg!", "error");
        return;
      }

      try {
        const response = await fetch("/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, subject }),
        });

        const data = await response.json();

        if (response.ok) {
          showNotification("Köszönjük az üzeneted! Hamarosan válaszolunk.", "success");
          contactForm.reset(); // Form mezők törlése
          if (charCounter) {
            charCounter.textContent = "0 / 300 karakter";
            charCounter.style.color = "#0f0";
          }
        } else {
          showNotification(data.error || "Hiba történt az üzenet küldése során!", "error");
        }
      } catch (error) {
        console.error("Hálózati hiba:", error);
        showNotification("Hálózati hiba történt. Kérjük próbáld újra!", "error");
      }
    });
  }

  // Notification megjelenítés
  function showNotification(message, type) {
    // Töröljük a korábbi értesítéseket
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Új értesítés létrehozása
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === "success" ? "rgba(0, 255, 0, 0.9)" : "rgba(255, 0, 0, 0.9)"};
        color: ${type === "success" ? "#000" : "#fff"};
        border-radius: 8px;
        font-family: Orbitron, sans-serif;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
      `;
    notification.textContent = message;

    // Animáció CSS hozzáadása (ha még nincs)
    if (!document.querySelector("#notificationStyles")) {
      const style = document.createElement("style");
      style.id = "notificationStyles";
      style.textContent = `
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
        `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Automatikus eltűnés 4 másodperc után
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
});
