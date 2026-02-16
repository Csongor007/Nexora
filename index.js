import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import bcrypt from "bcrypt";
import { PrismaClient } from "./src/generated/prisma/index.js";

const app = express();
const PORT = 3000;
const DB = new PrismaClient();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("src/public"));

// Session beállítás
app.use(
  session({
    secret: "valami-nagyon-titkos-kulcs-2025-nexora",
    resave: true, // Mindig mentse a sessiont még ha nem változott is
    saveUninitialized: false,
    cookie: {
      secure: false, // true lenne HTTPS-nél
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 nap (milliszekundumban)
    },
  }),
);

// View engine
app.set("view engine", "ejs");
app.set("views", "src/views");

// Session frissítő middleware - minden kérésnél frissíti a session lejáratát
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    // Ha be van jelentkezve, frissítsd a session maxAge-t
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 nap
  }
  next();
});

// Middleware a bejelentkezett felhasználó ellenőrzésére
const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/webshop");
  }
  // Session frissítése hogy ne járjon le
  req.session.touch();
  next();
};

// Főoldal
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

// Webshop
app.get("/webshop", (req, res) => {
  res.render("webshop", { user: req.session.user || null });
});

// Checkout oldal - CSAK bejelentkezett felhasználóknak!
app.get("/checkout", authMiddleware, (req, res) => {
  res.render("checkout", { user: req.session.user });
});

// Register POST - JSON és form support
app.post("/register", async (req, res) => {
  try {
    let { email, password, nev } = req.body;

    // Dekódoljuk az emailt ha URL-encodolt
    email = decodeURIComponent(email);

    // Validáció
    if (!email || !password || !nev) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
      }
      return res.status(400).send("Minden mező kitöltése kötelező!");
    }

    if (password.length < 6) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(400).json({ error: "A jelszónak minimum 6 karakter hosszúnak kell lennie!" });
      }
      return res.status(400).send("A jelszónak minimum 6 karakter hosszúnak kell lennie!");
    }

    // Ellenőrizzük, hogy az email már létezik-e
    const existingUser = await DB.felhasznalok.findFirst({
      where: { email },
    });

    if (existingUser) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(400).json({ error: "Ez az email cím már regisztrálva van!" });
      }
      return res.status(400).send("Ez az email cím már regisztrálva van!");
    }

    // Jelszó hashelése
    const jelszo_hash = await bcrypt.hash(password, 10);

    // Felhasználó létrehozása
    const newUser = await DB.felhasznalok.create({
      data: {
        email,
        jelszo_hash,
        nev,
      },
    });

    // Automatikus bejelentkezés
    req.session.userId = newUser.id;
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      nev: newUser.nev,
    };

    if (req.headers["content-type"] === "application/json") {
      return res.json({ success: true, user: req.session.user });
    }

    // Visszairányítás arra az oldalra, ahonnan jött
    const returnUrl = req.get("Referer") || "/webshop";
    res.redirect(returnUrl);
  } catch (error) {
    console.error("Regisztráció hiba:", error);
    if (req.headers["content-type"] === "application/json") {
      return res.status(500).json({ error: "Hiba történt a regisztráció során!" });
    }
    res.status(500).send("Hiba történt a regisztráció során!");
  }
});

// Login POST - JSON és form support
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    // Dekódoljuk az emailt ha URL-encodolt
    email = decodeURIComponent(email);

    // Validáció
    if (!email || !password) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(400).json({ error: "Email és jelszó megadása kötelező!" });
      }
      return res.status(400).send("Email és jelszó megadása kötelező!");
    }

    // Felhasználó keresése
    const user = await DB.felhasznalok.findFirst({
      where: { email },
    });

    if (!user) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(401).json({ error: "Hibás email vagy jelszó!" });
      }
      return res.status(401).send("Hibás email vagy jelszó!");
    }

    // Jelszó ellenőrzése
    const passwordMatch = await bcrypt.compare(password, user.jelszo_hash);

    if (!passwordMatch) {
      if (req.headers["content-type"] === "application/json") {
        return res.status(401).json({ error: "Hibás email vagy jelszó!" });
      }
      return res.status(401).send("Hibás email vagy jelszó!");
    }

    // Session beállítása
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      nev: user.nev,
    };

    if (req.headers["content-type"] === "application/json") {
      return res.json({ success: true, user: req.session.user });
    }

    // Visszairányítás arra az oldalra, ahonnan jött
    const returnUrl = req.get("Referer") || "/webshop";
    res.redirect(returnUrl);
  } catch (error) {
    console.error("Bejelentkezés hiba:", error);
    if (req.headers["content-type"] === "application/json") {
      return res.status(500).json({ error: "Hiba történt a bejelentkezés során!" });
    }
    res.status(500).send("Hiba történt a bejelentkezés során!");
  }
});

// Logout
app.get("/logout", (req, res) => {
  // Mentjük el az aktuális oldalt
  const returnUrl = req.get("Referer") || "/";

  req.session.destroy((err) => {
    if (err) {
      console.error("Kijelentkezés hiba:", err);
    }
    // Visszairányítás arra az oldalra, ahonnan jött
    res.redirect(returnUrl);
  });
});

// Jelszó módosítása POST endpoint
app.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    // Validáció
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Az új jelszónak legalább 6 karakter hosszúnak kell lennie!" });
    }

    // Felhasználó lekérése
    const user = await DB.felhasznalok.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található!" });
    }

    // Jelenlegi jelszó ellenőrzése
    const passwordMatch = await bcrypt.compare(currentPassword, user.jelszo_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "A jelenlegi jelszó helytelen!" });
    }

    // Új jelszó hashelése
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Jelszó frissítése az adatbázisban
    await DB.felhasznalok.update({
      where: { id: userId },
      data: {
        jelszo_hash: newPasswordHash,
      },
    });

    console.log(`✅ Felhasználó #${userId} sikeresen módosította a jelszavát`);

    return res.json({
      success: true,
      message: "Jelszó sikeresen megváltoztatva!",
    });
  } catch (error) {
    console.error("Jelszó módosítási hiba:", error);
    return res.status(500).json({ error: "Hiba történt a jelszó módosítása során!" });
  }
});

// Kapcsolatfelvétel POST
app.post("/contact", async (req, res) => {
  try {
    let { name, email, subject } = req.body;

    // Dekódoljuk az emailt ha URL-encodolt
    email = decodeURIComponent(email);

    // Validáció
    if (!name || !email || !subject) {
      return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
    }

    // Kapcsolatfelvétel mentése az adatbázisba
    await DB.kapcsolatfelvetel.create({
      data: {
        Nev: name,
        Email: email,
        Uzenet: subject,
      },
    });

    console.log("✅ Új kapcsolatfelvétel mentve!");

    return res.json({
      success: true,
      message: "Köszönjük az üzeneted! Hamarosan válaszolunk.",
    });
  } catch (error) {
    console.error("Kapcsolatfelvétel hiba:", error);
    return res.status(500).json({ error: "Hiba történt az üzenet küldése során!" });
  }
});

app.get("/aszf", (req, res) => {
  res.render("aszf", { user: req.session.user || null });
});

app.get("/gyik", (req, res) => {
  res.render("gyik", { user: req.session.user || null });
});

app.get("/kontakt", (req, res) => {
  res.render("kontakt", { user: req.session.user || null });
});

// Rendelések letöltése TXT formátumban - ZIP-elve
app.get("/orders/download", authMiddleware, async (req, res) => {
  try {
    const felhasznaloId = req.session.userId;
    
    // Felhasználó rendeléseinek lekérése
    const rendelesek = await DB.rendelesek.findMany({
      where: {
        felhasznalo_id: felhasznaloId,
      },
      include: {
        rendeles_tetel: true,
        szamlazasi_adatok: true,
      },
      orderBy: {
        rendelve: 'desc',
      },
    });
    
    if (rendelesek.length === 0) {
      return res.status(404).json({ error: "Még nincs rendelésed!" });
    }
    
    // Dinamikus import az archiver csomaghoz
    const archiver = (await import('archiver')).default;
    
    // ZIP stream létrehozása
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Response headerek beállítása
    res.attachment(`Nexora_Rendelesek_${Date.now()}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    
    // Pipe az archive-t a response-ba
    archive.pipe(res);
    
    // Minden rendeléshez generálunk egy TXT fájlt
    rendelesek.forEach((rendeles, index) => {
      const szamla = rendeles.szamlazasi_adatok;
      const tetelek = rendeles.rendeles_tetel;
      
      // TXT tartalom generálása
      let txtContent = '';
      txtContent += '═══════════════════════════════════════════════════════════════\n';
      txtContent += '                    NEXORA WEBSHOP - SZÁMLA                     \n';
      txtContent += '═══════════════════════════════════════════════════════════════\n\n';
      
      txtContent += `Rendelés azonosító: #${rendeles.id}\n`;
      txtContent += `Rendelés dátuma: ${new Date(rendeles.rendelve).toLocaleString('hu-HU')}\n`;
      txtContent += `Állapot: ${rendeles.allapot === 'feldolgozas_alatt' ? 'Feldolgozás alatt' : rendeles.allapot === 'teljesitve' ? 'Teljesítve' : 'Sikertelen'}\n`;
      txtContent += `Fizetési mód: ${rendeles.fizetesi_mod === 'card' ? 'Bankkártya' : rendeles.fizetesi_mod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}\n\n`;
      
      txtContent += '───────────────────────────────────────────────────────────────\n';
      txtContent += '                     SZÁMLÁZÁSI ADATOK                          \n';
      txtContent += '───────────────────────────────────────────────────────────────\n\n';
      
      if (szamla) {
        txtContent += `Név: ${szamla.nev}\n`;
        txtContent += `Email: ${szamla.email}\n`;
        txtContent += `Telefonszám: ${szamla.telefonszam}\n`;
        txtContent += `Cím: ${szamla.orszag}, ${szamla.iranyitoszam} ${szamla.varos}\n`;
        txtContent += `     ${szamla.utca_hazszam}\n\n`;
      }
      
      txtContent += '───────────────────────────────────────────────────────────────\n';
      txtContent += '                     MEGRENDELT TERMÉKEK                        \n';
      txtContent += '───────────────────────────────────────────────────────────────\n\n';
      
      let reszosszeg = 0;
      tetelek.forEach((tetel, i) => {
        const ar = parseFloat(tetel.egysegar);
        reszosszeg += ar;
        
        txtContent += `${i + 1}. ${tetel.termek_nev}\n`;
        txtContent += `   Kategória: ${tetel.termek_kategoria}\n`;
        txtContent += `   Ár: ${ar.toLocaleString('hu-HU')} Ft\n`;
        txtContent += `   Aktivációs kulcs: ${tetel.aktivacios_kulcs || 'Hamarosan'}\n`;
        txtContent += `   Állapot: ${tetel.kulcs_elkuldve ? '✓ Elküldve' : '⏳ Feldolgozás alatt'}\n\n`;
      });
      
      txtContent += '───────────────────────────────────────────────────────────────\n';
      txtContent += '                         ÖSSZEGZÉS                             \n';
      txtContent += '───────────────────────────────────────────────────────────────\n\n';
      
      txtContent += `Részösszeg:              ${reszosszeg.toLocaleString('hu-HU')} Ft\n`;
      txtContent += `Rendszerhasználati díj:  ${parseFloat(rendeles.rendszerhaszn_dij).toLocaleString('hu-HU')} Ft\n`;
      txtContent += `────────────────────────────────────────────\n`;
      txtContent += `VÉGÖSSZEG:               ${parseFloat(rendeles.vegosszeg).toLocaleString('hu-HU')} Ft\n\n`;
      
      txtContent += '═══════════════════════════════════════════════════════════════\n';
      txtContent += '                  Köszönjük a vásárlást!                       \n';
      txtContent += '                      www.nexora.hu                            \n';
      txtContent += '═══════════════════════════════════════════════════════════════\n';
      
      // Fájlnév: Rendeles_ID_Datum.txt
      const datum = new Date(rendeles.rendelve).toISOString().split('T')[0];
      const fajlnev = `Rendeles_${rendeles.id}_${datum}.txt`;
      
      // TXT hozzáadása a ZIP-hez
      archive.append(txtContent, { name: fajlnev });
    });
    
    // ZIP véglegesítése
    await archive.finalize();
    
  } catch (error) {
    console.error("Rendelések letöltési hiba:", error);
    
    // Ha már elkezdtük a stream-et, nem küldhetünk JSON-t
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: "Hiba történt a rendelések letöltése során!",
        details: error.message 
      });
    }
  }
});

// Rendelés feldolgozás POST endpoint
app.post("/order/create", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, country, address, city, zip, payment, cartItems, subtotal, serviceFee, total } = req.body;

    // Validáció
    if (!name || !email || !phone || !country || !address || !city || !zip || !payment || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Minden mező kitöltése kötelező és a kosár nem lehet üres!" });
    }

    // Összegek konvertálása (eltávolítjuk a "Ft" szöveget és a space-eket)
    const vegosszeg = parseFloat(total.replace(/[^0-9]/g, '')) || 0;
    const rendszerhaszn_dij = parseFloat(serviceFee.replace(/[^0-9]/g, '')) || 990;

    // Aktivációs kulcs generátor függvény
    function generateActivationKey() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let key = '';
      for (let i = 0; i < 3; i++) {
        let segment = '';
        for (let j = 0; j < 8; j++) {
          segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        key += segment;
        if (i < 2) key += '-';
      }
      return key; // Formátum: XXXXXXXX-XXXXXXXX-XXXXXXXX
    }

    // Rendelés létrehozása tranzakcióban
    const rendeles = await DB.$transaction(async (prisma) => {
      // 1. Rendelés létrehozása
      const ujRendeles = await prisma.rendelesek.create({
        data: {
          felhasznalo_id: req.session.userId,
          vegosszeg: vegosszeg,
          rendszerhaszn_dij: rendszerhaszn_dij,
          fizetesi_mod: payment,
          allapot: 'feldolgozas_alatt',
        },
      });

      // 2. Számlázási adatok mentése
      await prisma.szamlazasi_adatok.create({
        data: {
          rendeles_id: ujRendeles.id,
          nev: name,
          email: email,
          telefonszam: phone,
          orszag: country,
          varos: city,
          iranyitoszam: zip,
          utca_hazszam: address,
        },
      });

      // 3. Rendelési tételek létrehozása aktivációs kulcsokkal
      for (const item of cartItems) {
        const aktivaciosKulcs = generateActivationKey();
        
        await prisma.rendeles_tetel.create({
          data: {
            rendeles_id: ujRendeles.id,
            termek_nev: item.nev,
            termek_kategoria: item.kategoria,
            egysegar: parseFloat(item.ar),
            mennyiseg: 1,
            aktivacios_kulcs: aktivaciosKulcs,
            kulcs_elkuldve: false,
            aktivalt: false,
          },
        });
      }

      return ujRendeles;
    });

    // Session mentése hogy ne vesszen el
    req.session.save((err) => {
      if (err) {
        console.error('Session mentési hiba:', err);
      }
      
      // Sikeres válasz
      return res.json({
        success: true,
        orderId: rendeles.id,
        message: "Rendelés sikeresen létrehozva!",
      });
    });

  } catch (error) {
    console.error("Rendelés hiba:", error);
    return res.status(500).json({ 
      error: "Hiba történt a rendelés feldolgozása során!",
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
});