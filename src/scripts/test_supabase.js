import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabase() {
  console.log("Probando conexión a Supabase...");

  // 1. Comprobar si la clave funciona haciendo un query simple
  const { data: timeData, error: timeError } = await supabase.schema("data").from("paciente").select("*").limit(1);

  if (timeError) {
    console.log("❌ Error leyendo tabla:", timeError.message);
  } else {
    console.log("✅ Lectura de tabla OK:", timeData);
  }

  // 2. Intentar subir un archivo de prueba al bucket
  const buffer = Buffer.from("Test de subida desde Node.js");

  const { data, error } = await supabase.storage
    .from("expedientes")
    .upload("test/test.txt", buffer, {
      upsert: true,
      contentType: "text/plain",
    });

  if (error) {
    console.log("❌ Error subiendo archivo:", error.message);
  } else {
    console.log("✅ Subida exitosa:", data);
  }
}

testSupabase();
