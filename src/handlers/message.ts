import { askAI } from "../services/ai.js";

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body?: string };
}

interface WebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: { messages?: WhatsAppMessage[] };
    }>;
  }>;
}

async function sendMessage(to: string, message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION;

  if (!token || !phoneId || !version) {
    throw new Error("Konfigurasi WhatsApp belum lengkap.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: message }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
}

async function processMessage(message: WhatsAppMessage) {
  const owner = (process.env.OWNER_NUMBER || "").replace(/\D/g, "");
  const sender = message.from.replace(/\D/g, "");

  if (!owner || sender !== owner) return;

  if (message.type !== "text" || !message.text?.body) {
    await sendMessage(sender, "Saat ini Aiaka hanya menerima pesan teks.");
    return;
  }

  const input = message.text.body.trim();

  if (input === "/ping") {
    await sendMessage(sender, "Pong! Aiaka aktif.");
    return;
  }

  if (input === "/menu") {
    await sendMessage(
      sender,
      `*AIAKA BOT*

/menu - Menampilkan menu
/ping - Cek status bot
/ai [pertanyaan] - Tanya AI

AI Assistant: Online`
    );
    return;
  }

  const prompt = input.startsWith("/ai ")
    ? input.slice(4).trim()
    : input;

  if (!prompt) {
    await sendMessage(sender, "Masukkan pertanyaan setelah /ai.");
    return;
  }

  try {
    const answer = await askAI(prompt);
    await sendMessage(sender, answer);
  } catch (error) {
    console.error("AI processing error:", error);
    await sendMessage(sender, "Maaf, Aiaka sedang mengalami gangguan.");
  }
}

export async function handleWebhook(payload: WebhookPayload) {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const message of change.value?.messages || []) {
        await processMessage(message);
      }
    }
  }
}q
