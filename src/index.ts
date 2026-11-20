import express from "express";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { handleWebhook } from "./handlers/message.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Health check
app.get("/", (_req, res) => {
  res.json({
    name: "Aiaka",
    version: "0.1.0",
    status: "online",
    description: "Personal Multifunction WhatsApp Assistant"
  });
});

// Server health
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
    console.log("WhatsApp webhook verified.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// WhatsApp incoming messages
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-hub-signature-256"];

    // Verify Meta signature
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
        console.warn("Invalid webhook signature.");
        return res.sendStatus(401);
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("Missing WhatsApp App Secret.");
      return res.sendStatus(503);
    }

    let payload;

    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      return res.sendStatus(400);
    }

    console.log("WhatsApp webhook event received.");

    // Acknowledge Meta before processing
    res.sendStatus(200);

    // Process incoming messages
    void handleWebhook(payload).catch((error) => {
      console.error("Webhook processing error:", error);
    });
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("       AIAKA BOT SERVER");
  console.log("--------------------------------");
  console.log(`Status: Online`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("--------------------------------");
});
