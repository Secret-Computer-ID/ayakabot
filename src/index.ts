
import express from "express";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

app.get("/", (_req, res) => {
  res.json({
    name: "Aiaka",
    version: "0.1.0",
    status: "online",
    description: "Personal Multifunction WhatsApp Assistant"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime()
  });
});

// WhatsApp webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// WhatsApp incoming events
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-hub-signature-256"];

    if (APP_SECRET) {
      const expected =
        "sha256=" +
        crypto
          .createHmac("sha256", APP_SECRET)
          .update(req.body)
          .digest("hex");

      const received = Array.isArray(signature)
        ? signature[0]
        : signature;

      const valid =
        received &&
        Buffer.byteLength(received) ===
          Buffer.byteLength(expected) &&
        crypto.timingSafeEqual(
          Buffer.from(received),
          Buffer.from(expected)
        );

      if (!valid) {
        return res.sendStatus(401);
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("WhatsApp App Secret is not configured.");
      return res.sendStatus(503);
    }

    try {
      const payload = JSON.parse(req.body.toString());

      console.log("WhatsApp webhook event received.");

      // Message handling will be implemented next.

      return res.sendStatus(200);
    } catch {
      return res.sendStatus(400);
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Aiaka is running on port ${PORT}`);
});
