import { creationReport } from "../services/report.service.js";
import dotenv from "dotenv";

dotenv.config();

// Mock Data
const paciente = {
  id_paciente: 123,
  nombre_completo: "Juan Pérez",
  edad: 45,
  sexo: "Masculino",
};

const evaluacion = {
  presion_sistolica: 130,
  presion_diastolica: 85,
  colesterol_total: 210,
  glucosa: 105,
  imc: 26.5,
};

const resultado = {
  nivel_riesgo: "Moderado",
  riesgo_estimado: 12.5,
  enfermedades_detectadas: ["Hipertensión leve", "Colesterol alto"],
};

// Force DEBUG mode to save file locally
process.env.DEBUG_PDF = "true";

async function run() {
  console.log("Generating test PDF...");
  try {
    await creationReport(paciente, evaluacion, resultado);
    console.log("PDF generated successfully: ./debug_reporte.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

run();
