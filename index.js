import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import {PrismaClient} from "./src/generated/prisma/index.js";

const app = express();
const PORT = 3000;

const DB = new PrismaClient();

console.log(await DB.felhasznalok.findMany());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static("src/public"));

app.set("view engine", "ejs");
app.set("views", "src/views");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/webshop", (req, res) => {
  res.render("webshop");
});

app.get("/aszf", (req, res) => {
  res.render("aszf");
});

app.get("/gyik", (req, res) => {
  res.render("gyik");
});

app.get("/kontakt", (req, res) => {
  res.render("kontakt");
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
