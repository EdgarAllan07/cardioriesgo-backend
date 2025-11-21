import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log("Probando OpenAI...");

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: "Dime un número aleatorio del 1 al 10"
    });

    console.log("✅ Respuesta OpenAI:", response.output_text);
  } catch (err) {
    console.log("❌ Error OpenAI:", err.error?.message || err.message);
  }
}

testOpenAI();
