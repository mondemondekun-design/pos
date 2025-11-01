import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ POS Lacak Scraper aktif!");
});

app.get("/lacak/:resi", async (req, res) => {
  const { resi } = req.params;
  const url = `https://www.posindonesia.co.id/id/tracking/${resi}`;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const table = document.querySelector("table");
      if (!table) return null;
      const rows = [...table.querySelectorAll("tr")].map(tr =>
        [...tr.querySelectorAll("td")].map(td => td.innerText.trim())
      );
      return rows;
    });

    await browser.close();
    if (!data) {
      res.status(404).json({ error: "Data pelacakan tidak ditemukan" });
    } else {
      res.json({ resi, data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
