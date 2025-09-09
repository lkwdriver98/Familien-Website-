import express from "express";
import compression from "compression";
import serveStatic from "serve-static";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(compression());

// Statisches Verzeichnis: dein fertiges Frontend
const clientDir = path.join(__dirname, "..", "schade-family-hub");
app.use(serveStatic(clientDir, { index: ["index.html"] }));

// Fallback auf index.html (Single-Page)
app.get("*", (_req, res) => res.sendFile(path.join(clientDir, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Family Hub running on :" + port));
