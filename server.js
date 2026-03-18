import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();

function isRealEstate(text) {
  const keywords = [
    "vivienda",
    "piso",
    "casa",
    "inmueble",
    "parcela",
    "solar",
    "finca",
  ];
  return keywords.some((k) => text.includes(k));
}

app.get("/", (req, res) => {
  res.send("BOE + BOJA Investor Bot Running 🚀");
});

app.get("/api/auctions", async (req, res) => {
  const results = [];

  // -------- BOE --------
  const boeUrl = "https://subastas.boe.es/subastas_ava.php";
  const boeRes = await fetch(boeUrl);
  const boeHtml = await boeRes.text();
  const $boe = cheerio.load(boeHtml);

  $boe(".resultado-busqueda").each((i, el) => {
    const title = $boe(el).find(".titulo").text().toLowerCase();
    const link =
      "https://subastas.boe.es/" +
      $boe(el).find("a").attr("href");

    if (
      (title.includes("sevilla") ||
        title.includes("cádiz") ||
        title.includes("cadiz")) &&
      isRealEstate(title)
    ) {
      results.push({
        title,
        link,
        province: title.includes("sevilla")
          ? "SEVILLA"
          : "CADIZ",
        source: "BOE",
        score: Math.floor(Math.random() * 100),
      });
    }
  });

  // -------- BOJA --------
  try {
    const bojaUrl =
      "https://www.juntadeandalucia.es/boja/busqueda-avanzada.html";

    const bojaRes = await fetch(bojaUrl);
    const bojaHtml = await bojaRes.text();
    const $boja = cheerio.load(bojaHtml);

    $boja("a").each((i, el) => {
      const text = $boja(el).text().toLowerCase();
      const link = $boja(el).attr("href");

      if (
        text.includes("subasta") &&
        (text.includes("sevilla") ||
          text.includes("cádiz") ||
          text.includes("cadiz")) &&
        isRealEstate(text)
      ) {
        results.push({
          title: text,
          link:
            "https://www.juntadeandalucia.es" + link,
          province: text.includes("sevilla")
            ? "SEVILLA"
            : "CADIZ",
          source: "BOJA",
          score: Math.floor(Math.random() * 100),
        });
      }
    });
  } catch (e) {
    console.log("BOJA failed (normal sometimes)");
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
