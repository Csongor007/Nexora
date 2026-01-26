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
    secret: "valami-nagyon-titkos-kulcs-2025-nexora", // Változtasd meg valami véletlenszerűre!
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // true legyen HTTPS-nél
      maxAge: 24 * 60 * 60 * 1000 // 24 óra
    }
  })
);

// View engine
app.set("view engine", "ejs");
app.set("views", "src/views");

// Middleware a bejelentkezett felhasználó ellenőrzésére
const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/webshop");
  }
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

// Register POST - JSON és form support
app.post("/register", async (req, res) => {
  try {
    const { email, password, nev } = req.body;
    const decodedEmail = decodeURIComponent(email);

    // Validáció
    if (!email || !password || !nev) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
      }
      return res.status(400).send("Minden mező kitöltése kötelező!");
    }

    if (password.length < 6) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ error: "A jelszónak minimum 6 karakter hosszúnak kell lennie!" });
      }
      return res.status(400).send("A jelszónak minimum 6 karakter hosszúnak kell lennie!");
    }

    // Ellenőrizzük, hogy az email már létezik-e
    const existingUser = await DB.felhasznalok.findFirst({
      where: { email: decodedEmail }
    });

    if (existingUser) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ error: "Ez az email cím már regisztrálva van!" });
      }
      return res.status(400).send("Ez az email cím már regisztrálva van!");
    }

    // Jelszó hashelése
    const jelszo_hash = await bcrypt.hash(password, 10);

    // Felhasználó létrehozása
    const newUser = await DB.felhasznalok.create({
      data: {
        email: decodedEmail,
        jelszo_hash,
        nev
      }
    });

    // Automatikus bejelentkezés
    req.session.userId = newUser.id;
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      nev: newUser.nev
    };

    if (req.headers['content-type'] === 'application/json') {
      return res.json({ success: true, user: req.session.user });
    }
    res.redirect("/webshop");
  } catch (error) {
    console.error("Regisztráció hiba:", error);
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ error: "Hiba történt a regisztráció során!" });
    }
    res.status(500).send("Hiba történt a regisztráció során!");
  }
});

// Login POST - JSON és form support
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validáció
    if (!email || !password) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ error: "Email és jelszó megadása kötelező!" });
      }
      return res.status(400).send("Email és jelszó megadása kötelező!");
    }

    // Felhasználó keresése
    const user = await DB.felhasznalok.findFirst({
      where: { email }
    });

    if (!user) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: "Hibás email vagy jelszó!" });
      }
      return res.status(401).send("Hibás email vagy jelszó!");
    }

    // Jelszó ellenőrzése
    const passwordMatch = await bcrypt.compare(password, user.jelszo_hash);

    if (!passwordMatch) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: "Hibás email vagy jelszó!" });
      }
      return res.status(401).send("Hibás email vagy jelszó!");
    }

    // Session beállítása
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      nev: user.nev
    };

    if (req.headers['content-type'] === 'application/json') {
      return res.json({ success: true, user: req.session.user });
    }
    res.redirect("/webshop");
  } catch (error) {
    console.error("Bejelentkezés hiba:", error);
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ error: "Hiba történt a bejelentkezés során!" });
    }
    res.status(500).send("Hiba történt a bejelentkezés során!");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Kijelentkezés hiba:", err);
    }
    res.redirect("/webshop");
  });
});

app.get('/aszf', (req, res) => {
    // req.user HELYETT req.session.user kell!
    res.render('aszf', { user: req.session.user || null }); 
});

app.get("/gyik", (req, res) => {
  res.render("gyik", { user: req.session.user || null });
});

app.get("/kontakt", (req, res) => {
  res.render("kontakt", { user: req.session.user || null });
});

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
});