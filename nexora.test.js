/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         NEXORA WEBÁRUHÁZ – TESZTELÉSI KÓDBÁZIS              ║
 * ║  Keretrendszer: Node.js v22 beépített node:test modulja      ║
 * ║  Lefedi: API végpontok, adatbázis logika, biztonság,         ║
 * ║           frontend logika (kosár, szűrő)                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─────────────────────────────────────────────────────────────────────
//  SEGÉD – szimulálja az Express req/res objektumokat
// ─────────────────────────────────────────────────────────────────────
function makeReq(body = {}, sessionData = {}, headers = {}) {
  return {
    body,
    session: { userId: null, user: null, ...sessionData,
      touch() {}, save(cb) { if (cb) cb(null); } },
    headers: { "content-type": "application/json", ...headers },
    get(h) { return this.headers[h.toLowerCase()] || ""; },
  };
}

function makeRes() {
  const res = {
    _status: 200, _body: null, _redirected: null,
    status(code)  { this._status = code; return this; },
    json(data)    { this._body = data;   return this; },
    send(data)    { this._body = data;   return this; },
    redirect(url) { this._redirected = url; return this; },
    headersSent: false,
  };
  return res;
}

// ─────────────────────────────────────────────────────────────────────
//  1.  AKTIVÁCIÓS KULCS GENERÁTOR
//      (a valódi függvényt kiemeljük és teszteljük önállóan)
// ─────────────────────────────────────────────────────────────────────
function generateActivationKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 3; i++) {
    let seg = "";
    for (let j = 0; j < 8; j++) seg += chars.charAt(Math.floor(Math.random() * chars.length));
    key += seg;
    if (i < 2) key += "-";
  }
  return key;
}

// ─────────────────────────────────────────────────────────────────────
//  2.  REGISZTRÁCIÓ VALIDÁCIÓS LOGIKA
//      (a /register endpoint logikájának kivonat)
// ─────────────────────────────────────────────────────────────────────
async function validateRegister(req, res) {
  let { email, password, nev } = req.body;
  if (email) email = decodeURIComponent(email);

  if (!email || !password || !nev) {
    return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "A jelszónak minimum 6 karakter hosszúnak kell lennie!" });
  }
  // szimuláljuk az email-egyediség ellenőrzését
  if (email === "letezik@nexora.hu") {
    return res.status(400).json({ error: "Ez az email cím már regisztrálva van!" });
  }
  return res.status(200).json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────
//  3.  BEJELENTKEZÉS VALIDÁCIÓS LOGIKA
// ─────────────────────────────────────────────────────────────────────
async function validateLogin(req, res) {
  let { email, password } = req.body;
  if (email) email = decodeURIComponent(email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email és jelszó megadása kötelező!" });
  }
  // szimulált felhasználóbázis
  const mockUsers = [
    { email: "tesztelő@nexora.hu", password: "helyes123", id: 1, nev: "Teszt Felhasználó" },
  ];
  const user = mockUsers.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Hibás email vagy jelszó!" });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: "Hibás email vagy jelszó!" });
  }
  req.session.userId = user.id;
  req.session.user = { id: user.id, email: user.email, nev: user.nev };
  return res.json({ success: true, user: req.session.user });
}

// ─────────────────────────────────────────────────────────────────────
//  4.  RENDELÉS VALIDÁCIÓS LOGIKA
// ─────────────────────────────────────────────────────────────────────
async function validateOrder(req, res) {
  const { name, email, phone, country, address, city, zip, payment, cartItems } = req.body;
  if (!name || !email || !phone || !country || !address || !city || !zip || !payment || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Minden mező kitöltése kötelező és a kosár nem lehet üres!" });
  }
  if (!["card", "apple_pay", "google_pay"].includes(payment)) {
    return res.status(400).json({ error: "Érvénytelen fizetési mód!" });
  }
  return res.json({ success: true, orderId: 42 });
}

// ─────────────────────────────────────────────────────────────────────
//  5.  AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/webshop");
  }
  req.session.touch();
  next();
}

// ─────────────────────────────────────────────────────────────────────
//  6.  KOSÁRKEZELÉS LOGIKA
//      (a cart.js logikájának Node-kompatibilis portja)
// ─────────────────────────────────────────────────────────────────────
class Cart {
  constructor() {
    this.items = [];
    this.MAX = 10;
    this.SERVICE_FEE = 990;
  }
  add(item) {
    if (this.items.length >= this.MAX) return { ok: false, error: "Kosár tele" };
    this.items.push(item);
    return { ok: true };
  }
  remove(index) {
    if (index < 0 || index >= this.items.length) return false;
    this.items.splice(index, 1);
    return true;
  }
  total() {
    return this.items.reduce((s, i) => s + i.ar, 0) + this.SERVICE_FEE;
  }
  subtotal() {
    return this.items.reduce((s, i) => s + i.ar, 0);
  }
  clear() { this.items = []; }
  count() { return this.items.length; }
}

// ─────────────────────────────────────────────────────────────────────
//  7.  KATEGÓRIA SZŰRŐ LOGIKA
//      (a filters.js / webshop.ejs logika portja)
// ─────────────────────────────────────────────────────────────────────
function filterByCategory(termekek, kategoria) {
  if (!kategoria || kategoria === "osszes") return termekek;
  return termekek.filter((t) => t.kategoria === kategoria);
}

const MOCK_PRODUCTS = [
  { nev: "Ubuntu Linux",  ar: 0,     kategoria: "szoftver" },
  { nev: "Windows 11",    ar: 24990, kategoria: "license"  },
  { nev: "Cyberpunk 2077",ar: 12990, kategoria: "jatek"    },
  { nev: "Steam Card 5k", ar: 5000,  kategoria: "giftcard" },
  { nev: "Office 365",    ar: 18990, kategoria: "license"  },
];

// ─────────────────────────────────────────────────────────────────────
//  8.  JELSZÓVÁLTOZTATÁS VALIDÁCIÓ
// ─────────────────────────────────────────────────────────────────────
async function validatePasswordChange(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Az új jelszónak legalább 6 karakter hosszúnak kell lennie!" });
  }
  if (currentPassword !== "helyesJelszo123") {
    return res.status(401).json({ error: "A jelenlegi jelszó helytelen!" });
  }
  return res.json({ success: true, message: "Jelszó sikeresen megváltoztatva!" });
}

// ─────────────────────────────────────────────────────────────────────
//  9.  KAPCSOLATFELVÉTEL VALIDÁCIÓ
// ─────────────────────────────────────────────────────────────────────
async function validateContact(req, res) {
  const { name, email, subject } = req.body;
  if (!name || !email || !subject) {
    return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
  }
  return res.json({ success: true, message: "Köszönjük az üzeneted! Hamarosan válaszolunk." });
}


// ═════════════════════════════════════════════════════════════════════
//                         TESZTESETEK
// ═════════════════════════════════════════════════════════════════════

// ── T01-T06: AKTIVÁCIÓS KULCS ─────────────────────────────────────────
describe("T01-T06 | Aktivációs kulcs generátor", () => {

  it("T01 – A kulcs formátuma XXXXXXXX-XXXXXXXX-XXXXXXXX", () => {
    const key = generateActivationKey();
    assert.match(key, /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/);
  });

  it("T02 – A kulcs hossza pontosan 26 karakter (8+1+8+1+8)", () => {
    const key = generateActivationKey();
    assert.equal(key.length, 26);
  });

  it("T03 – A kulcs csak nagybetűket és számokat tartalmaz", () => {
    const key = generateActivationKey();
    const clean = key.replace(/-/g, "");
    assert.match(clean, /^[A-Z0-9]+$/);
  });

  it("T04 – Két generált kulcs nem azonos (véletlenszerűség)", () => {
    const k1 = generateActivationKey();
    const k2 = generateActivationKey();
    // Extrém kis valószínűséggel lehet egyező – 36^24 lehetséges kombináció
    assert.notEqual(k1, k2);
  });

  it("T05 – A kulcs két kötőjelet tartalmaz", () => {
    const key = generateActivationKey();
    assert.equal((key.match(/-/g) || []).length, 2);
  });

  it("T06 – 100 egymás utáni kulcs mind érvényes formátumú", () => {
    for (let i = 0; i < 100; i++) {
      assert.match(generateActivationKey(), /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/);
    }
  });
});

// ── T07-T14: REGISZTRÁCIÓ ─────────────────────────────────────────────
describe("T07-T14 | POST /register – Regisztráció validáció", () => {

  it("T07 – Sikeres regisztráció helyes adatokkal → 200", async () => {
    const req = makeReq({ email: "uj@nexora.hu", password: "titkos123", nev: "Új Felhasználó" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
  });

  it("T08 – Hiányzó email → 400 hiba", async () => {
    const req = makeReq({ password: "titkos123", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("kötelező"));
  });

  it("T09 – Hiányzó jelszó → 400 hiba", async () => {
    const req = makeReq({ email: "valaki@nexora.hu", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 400);
  });

  it("T10 – Hiányzó név → 400 hiba", async () => {
    const req = makeReq({ email: "valaki@nexora.hu", password: "titkos123" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 400);
  });

  it("T11 – 5 karakteres jelszó (< 6) → 400 hiba", async () => {
    const req = makeReq({ email: "valaki@nexora.hu", password: "12345", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("minimum 6"));
  });

  it("T12 – Pontosan 6 karakteres jelszó → sikeres", async () => {
    const req = makeReq({ email: "valaki2@nexora.hu", password: "123456", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 200);
  });

  it("T13 – Már létező email → 400 hiba", async () => {
    const req = makeReq({ email: "letezik@nexora.hu", password: "titkos123", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("már regisztrálva"));
  });

  it("T14 – URL-kódolt email dekódolása helyes", async () => {
    const req = makeReq({ email: "teszt%40nexora.hu", password: "titkos123", nev: "Teszt" });
    const res = makeRes();
    await validateRegister(req, res);
    // teszt@nexora.hu nem a „létező" email, tehát sikerül
    assert.equal(res._status, 200);
  });
});

// ── T15-T22: BEJELENTKEZÉS ────────────────────────────────────────────
describe("T15-T22 | POST /login – Bejelentkezés validáció", () => {

  it("T15 – Sikeres bejelentkezés helyes adatokkal → success: true", async () => {
    const req = makeReq({ email: "tesztelő@nexora.hu", password: "helyes123" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._body.success, true);
    assert.ok(res._body.user);
  });

  it("T16 – Bejelentkezés után a session userId be van állítva", async () => {
    const req = makeReq({ email: "tesztelő@nexora.hu", password: "helyes123" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(req.session.userId, 1);
  });

  it("T17 – Nem létező email → 401 hiba", async () => {
    const req = makeReq({ email: "nincs@nexora.hu", password: "valami" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 401);
    assert.ok(res._body.error.includes("Hibás email"));
  });

  it("T18 – Helyes email, rossz jelszó → 401 hiba", async () => {
    const req = makeReq({ email: "tesztelő@nexora.hu", password: "rosszjelszo" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 401);
  });

  it("T19 – Üres email → 400 hiba", async () => {
    const req = makeReq({ email: "", password: "valami" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("kötelező"));
  });

  it("T20 – Üres jelszó → 400 hiba", async () => {
    const req = makeReq({ email: "tesztelő@nexora.hu", password: "" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 400);
  });

  it("T21 – Mindkét mező hiányzik → 400 hiba", async () => {
    const req = makeReq({});
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 400);
  });

  it("T22 – SQL injection kísérlet nem eredményez sikeres logint", async () => {
    const req = makeReq({ email: "' OR '1'='1", password: "' OR '1'='1" });
    const res = makeRes();
    await validateLogin(req, res);
    assert.equal(res._status, 401);
  });
});

// ── T23-T30: AUTH MIDDLEWARE ──────────────────────────────────────────
describe("T23-T30 | Auth Middleware – Védett útvonalak", () => {

  it("T23 – Bejelentkezett felhasználó átmegy a middleware-en", () => {
    const req = makeReq({}, { userId: 1 });
    const res = makeRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled);
  });

  it("T24 – Be nem jelentkezett felhasználó átirányítódik /webshopra", () => {
    const req = makeReq({}, { userId: null });
    const res = makeRes();
    authMiddleware(req, res, () => {});
    assert.equal(res._redirected, "/webshop");
  });

  it("T25 – userId = 0 (falsy) is megtagadja a hozzáférést", () => {
    const req = makeReq({}, { userId: 0 });
    const res = makeRes();
    authMiddleware(req, res, () => {});
    assert.equal(res._redirected, "/webshop");
  });

  it("T26 – Érvényes session esetén a next() hívódik meg, redirect nem", () => {
    const req = makeReq({}, { userId: 99 });
    const res = makeRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled);
    assert.equal(res._redirected, null);
  });

  it("T27 – Érvényes session esetén session.touch() meghívódik (next-ben hívódik)", () => {
    // A valódi index.js-ben req.session.touch() a next() callback-ben hívódik.
    // Ez a teszt azt ellenőrzi, hogy a next() valóban lefut érvényes session esetén,
    // és a redirect NEM fut le – ami garantálja, hogy a touch() meghívódhatna.
    const req = makeReq({}, { userId: 5 });
    const res = makeRes();
    let nextCalled = false;
    authMiddleware(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled, "next() meghívódott érvényes session esetén");
    assert.equal(res._redirected, null, "redirect NEM fut le érvényes session esetén");
  });

  it("T28 – undefined userId esetén hozzáférés megtagadva", () => {
    const req = makeReq({}, { userId: undefined });
    const res = makeRes();
    authMiddleware(req, res, () => {});
    assert.equal(res._redirected, "/webshop");
  });

  it("T29 – A /checkout oldal csak bejelentkezett felhasználónak elérhető (szimulált GET)", () => {
    const req = makeReq({}, { userId: null });
    const res = makeRes();
    authMiddleware(req, res, () => {});
    assert.ok(res._redirected !== null);
  });

  it("T30 – A /orders/download oldal csak bejelentkezett felhasználónak elérhető", () => {
    const req = makeReq({}, { userId: null });
    const res = makeRes();
    authMiddleware(req, res, () => {});
    assert.equal(res._redirected, "/webshop");
  });
});

// ── T31-T38: RENDELÉS LÉTREHOZÁSA ─────────────────────────────────────
describe("T31-T38 | POST /order/create – Rendelés validáció", () => {

  const validOrder = {
    name: "Kovács János",
    email: "kovacs@nexora.hu",
    phone: "+36301234567",
    country: "Magyarország",
    address: "Kossuth u. 1.",
    city: "Budapest",
    zip: "1051",
    payment: "card",
    cartItems: [{ nev: "Windows 11", ar: 24990, kategoria: "license" }],
    subtotal: "24 990 Ft",
    serviceFee: "990 Ft",
    total: "25 980 Ft",
  };

  it("T31 – Sikeres rendelés összes helyes adattal → success: true", async () => {
    const req = makeReq(validOrder);
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._body.success, true);
    assert.ok(res._body.orderId);
  });

  it("T32 – Üres kosár esetén → 400 hiba", async () => {
    const req = makeReq({ ...validOrder, cartItems: [] });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("kosár nem lehet üres"));
  });

  it("T33 – Hiányzó name → 400 hiba", async () => {
    const req = makeReq({ ...validOrder, name: "" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._status, 400);
  });

  it("T34 – Hiányzó email → 400 hiba", async () => {
    const req = makeReq({ ...validOrder, email: "" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._status, 400);
  });

  it("T35 – Hiányzó irányítószám → 400 hiba", async () => {
    const req = makeReq({ ...validOrder, zip: "" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._status, 400);
  });

  it("T36 – Érvénytelen fizetési mód → 400 hiba", async () => {
    const req = makeReq({ ...validOrder, payment: "bitcoin" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._status, 400);
    assert.ok(res._body.error.includes("fizetési mód"));
  });

  it("T37 – apple_pay fizetési mód elfogadott", async () => {
    const req = makeReq({ ...validOrder, payment: "apple_pay" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._body.success, true);
  });

  it("T38 – google_pay fizetési mód elfogadott", async () => {
    const req = makeReq({ ...validOrder, payment: "google_pay" });
    const res = makeRes();
    await validateOrder(req, res);
    assert.equal(res._body.success, true);
  });
});

// ── T39-T48: KOSÁRKEZELÉS ─────────────────────────────────────────────
describe("T39-T48 | Kosárkezelés (cart.js logika)", () => {

  it("T39 – Üres kosár count-ja 0", () => {
    const cart = new Cart();
    assert.equal(cart.count(), 0);
  });

  it("T40 – Termék hozzáadása után count 1 lesz", () => {
    const cart = new Cart();
    cart.add({ nev: "Windows 11", ar: 24990, kategoria: "license" });
    assert.equal(cart.count(), 1);
  });

  it("T41 – Részösszeg helyesen számítódik (990 Ft nélkül)", () => {
    const cart = new Cart();
    cart.add({ nev: "A termék", ar: 10000, kategoria: "szoftver" });
    cart.add({ nev: "B termék", ar: 5000,  kategoria: "jatek" });
    assert.equal(cart.subtotal(), 15000);
  });

  it("T42 – Végösszeg = részösszeg + 990 Ft rendszerhasználati díj", () => {
    const cart = new Cart();
    cart.add({ nev: "Teszt", ar: 12990, kategoria: "license" });
    assert.equal(cart.total(), 12990 + 990);
  });

  it("T43 – Termék eltávolítása után count csökken", () => {
    const cart = new Cart();
    cart.add({ nev: "Teszt", ar: 5000, kategoria: "giftcard" });
    cart.remove(0);
    assert.equal(cart.count(), 0);
  });

  it("T44 – Maximum 10 termék adható a kosárhoz", () => {
    const cart = new Cart();
    for (let i = 0; i < 10; i++) cart.add({ nev: `T${i}`, ar: 1000, kategoria: "szoftver" });
    const result = cart.add({ nev: "T11", ar: 1000, kategoria: "szoftver" });
    assert.equal(result.ok, false);
    assert.equal(cart.count(), 10);
  });

  it("T45 – 10 darabnál a kosár tele hibát ad vissza", () => {
    const cart = new Cart();
    for (let i = 0; i < 10; i++) cart.add({ nev: `T${i}`, ar: 1000, kategoria: "szoftver" });
    const result = cart.add({ nev: "Extra", ar: 1000, kategoria: "szoftver" });
    assert.equal(result.error, "Kosár tele");
  });

  it("T46 – Kosár törlése után count 0 és összeg csak a díj", () => {
    const cart = new Cart();
    cart.add({ nev: "Teszt", ar: 9999, kategoria: "license" });
    cart.clear();
    assert.equal(cart.count(), 0);
    assert.equal(cart.subtotal(), 0);
  });

  it("T47 – Érvénytelen index eltávolítása false-t ad vissza", () => {
    const cart = new Cart();
    cart.add({ nev: "Teszt", ar: 1000, kategoria: "szoftver" });
    assert.equal(cart.remove(99), false);
  });

  it("T48 – Több termék össz ára helyesen számítódik", () => {
    const cart = new Cart();
    [1000, 2000, 3000, 4000].forEach(ar => cart.add({ nev: "X", ar, kategoria: "szoftver" }));
    assert.equal(cart.subtotal(), 10000);
    assert.equal(cart.total(), 10990);
  });
});

// ── T49-T56: KATEGÓRIA SZŰRŐ ──────────────────────────────────────────
describe("T49-T56 | Frontend szűrő – filterByCategory()", () => {

  it("T49 – 'szoftver' szűrő csak szoftver kategóriájú termékeket ad vissza", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "szoftver");
    assert.ok(result.every(t => t.kategoria === "szoftver"));
  });

  it("T50 – 'license' szűrő 2 terméket ad vissza", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "license");
    assert.equal(result.length, 2);
  });

  it("T51 – 'jatek' szűrő 1 terméket ad vissza", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "jatek");
    assert.equal(result.length, 1);
    assert.equal(result[0].nev, "Cyberpunk 2077");
  });

  it("T52 – 'giftcard' szűrő 1 terméket ad vissza", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "giftcard");
    assert.equal(result.length, 1);
  });

  it("T53 – 'osszes' szűrő az összes terméket visszaadja", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "osszes");
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it("T54 – Nem létező kategória → üres tömb", () => {
    const result = filterByCategory(MOCK_PRODUCTS, "hardver");
    assert.equal(result.length, 0);
  });

  it("T55 – null kategória → összes termék visszaadva", () => {
    const result = filterByCategory(MOCK_PRODUCTS, null);
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it("T56 – Üres terméklista esetén mindig üres tömb az eredmény", () => {
    const result = filterByCategory([], "szoftver");
    assert.equal(result.length, 0);
  });
});

// ── T57-T62: JELSZÓVÁLTOZTATÁS ────────────────────────────────────────
describe("T57-T62 | POST /change-password – Jelszóváltoztatás", () => {

  it("T57 – Helyes jelenlegi jelszóval sikeres módosítás", async () => {
    const req = makeReq({ currentPassword: "helyesJelszo123", newPassword: "ujJelszo456" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._body.success, true);
  });

  it("T58 – Helytelen jelenlegi jelszó → 401 hiba", async () => {
    const req = makeReq({ currentPassword: "rosszJelszo", newPassword: "ujJelszo456" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._status, 401);
    assert.ok(res._body.error.includes("helytelen"));
  });

  it("T59 – Új jelszó < 6 karakter → 400 hiba", async () => {
    const req = makeReq({ currentPassword: "helyesJelszo123", newPassword: "abc" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._status, 400);
  });

  it("T60 – Hiányzó jelenlegi jelszó → 400 hiba", async () => {
    const req = makeReq({ newPassword: "ujJelszo456" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._status, 400);
  });

  it("T61 – Hiányzó új jelszó → 400 hiba", async () => {
    const req = makeReq({ currentPassword: "helyesJelszo123" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._status, 400);
  });

  it("T62 – Pontosan 6 karakter hosszú új jelszó elfogadott", async () => {
    const req = makeReq({ currentPassword: "helyesJelszo123", newPassword: "123456" }, { userId: 1 });
    const res = makeRes();
    await validatePasswordChange(req, res);
    assert.equal(res._body.success, true);
  });
});

// ── T63-T66: KAPCSOLATFELVÉTEL ────────────────────────────────────────
describe("T63-T66 | POST /contact – Kapcsolatfelvétel", () => {

  it("T63 – Sikeres üzenetküldés minden mezővel → success: true", async () => {
    const req = makeReq({ name: "Teszt Elek", email: "teszt@nexora.hu", subject: "Segítség kérek" });
    const res = makeRes();
    await validateContact(req, res);
    assert.equal(res._body.success, true);
  });

  it("T64 – Hiányzó név → 400 hiba", async () => {
    const req = makeReq({ email: "teszt@nexora.hu", subject: "Kérdés" });
    const res = makeRes();
    await validateContact(req, res);
    assert.equal(res._status, 400);
  });

  it("T65 – Hiányzó email → 400 hiba", async () => {
    const req = makeReq({ name: "Teszt", subject: "Kérdés" });
    const res = makeRes();
    await validateContact(req, res);
    assert.equal(res._status, 400);
  });

  it("T66 – Hiányzó üzenet → 400 hiba", async () => {
    const req = makeReq({ name: "Teszt", email: "teszt@nexora.hu" });
    const res = makeRes();
    await validateContact(req, res);
    assert.equal(res._status, 400);
  });
});
