
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI(
  prompt: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key belum dikonfigurasi.");
  }

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are Aiaka, a helpful and intelligent WhatsApp assistant. Reply naturally and concisely."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1024
  });

  return (
    completion.choices[0]?.message?.content ||
    "Maaf, AI tidak memberikan respons."
  );
}
