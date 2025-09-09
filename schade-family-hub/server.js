// Minimaler Web Push Server (Node + Express)
// Installation lokal: npm i express web-push cors
import express from 'express';
import cors from 'cors';
import webpush from 'web-push';

const app = express();
app.use(cors());
app.use(express.json());

// VAPID-Keys als ENV in Render setzen
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
webpush.setVapidDetails('mailto:you@example.com', VAPID_PUBLIC, VAPID_PRIVATE);

// Simple In-Memory Store (für echte Nutzung in DB auslagern)
const subs = new Set();

app.post('/save', (req, res) => {
  subs.add(req.body);
  res.json({ ok: true });
});

app.post('/test', async (req, res) => {
  const payload = JSON.stringify({ title:'Family Hub', body:'Test-Push 👋', url:'/' });
  let sent = 0;
  for (const sub of subs) {
    try { await webpush.sendNotification(sub, payload); sent++; } catch (e) {}
  }
  res.json({ sent });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Push server on :' + port));
