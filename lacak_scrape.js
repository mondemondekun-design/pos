import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/api", async (req, res) => {
  const resi = req.query.resi;
  if (!resi) return res.json({ status: "error", message: "Nomor resi kosong" });

  const url = `https://www.posindonesia.co.id/id/tracking/${resi}`;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("table", { timeout: 25000 });

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr"));
      return rows.map(r => {
        const c = r.querySelectorAll("td");
        return {
          tanggal: c[0]?.innerText.trim() || "",
          keterangan: c[1]?.innerText.trim() || ""
        };
      });
    });

    await browser.close();
    res.json({ status: "success", resi, data });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server berjalan di port ${port}`));
