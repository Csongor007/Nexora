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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
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

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
});
