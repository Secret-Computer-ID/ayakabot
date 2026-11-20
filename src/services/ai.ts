
import Groq from "groq-sdk";

export async function askAI(
  prompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key belum dikonfigurasi.");
  }

  const groq = new Groq({
    apiKey
  });

  const completion = await groq.chat.completions.create({
    model:
      process.env.GROQ_MODEL ||
      "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are Aiaka, a helpful personal AI assistant. Reply naturally, clearly, and concisely."
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
    "Maaf, tidak ada respons dari AI."
  );
}
