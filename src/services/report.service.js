import PDFDocument from "pdfkit-table";
import { PassThrough } from "stream";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// const client = new OpenAI(); // Moved inside function

// Usa claves privadas (NO las NEXT_PUBLIC)
// const supabase = createClient(...); // Moved inside function

/* ============================================================
   FUNCIÓN PARA TABLA ESTILIZADA (HEADER GRIS + BORDES)
============================================================ */
function drawStyledTable(
  doc,
  table,
  startX,
  startY,
  columnWidths,
  rowHeight = 26
) {
  let y = startY;

  table.forEach((row, rowIndex) => {
    let x = startX;

    row.forEach((cell, colIndex) => {
      const width = columnWidths[colIndex];

      if (rowIndex === 0) {
        doc.rect(x, y, width, rowHeight).fill("#E5E5E5").stroke();
        doc.fillColor("#000").font("Helvetica-Bold");
      } else {
        doc.rect(x, y, width, rowHeight).stroke();
        doc.fillColor("#000").font("Helvetica");
      }

      doc.fontSize(11).text(String(cell), x + 5, y + 7, {
        width: width - 10,
        align: "left",
      });

      x += width;
    });

    y += rowHeight;
  });

  return y;
}

/* ============================================================
   FUNCIÓN PRINCIPAL: CREAR REPORTE
============================================================ */
export async function creationReport(paciente, evaluacion, resultado) {
  /* ============================================================
     1. GENERAR TEXTO CON IA
  ============================================================ */
  /* ============================================================
     1. GENERAR TEXTO CON IA
  ============================================================ */
  const prompt = `
  Actúa como un cardiólogo experto. Analiza los siguientes datos de un paciente y genera una lista de 5 a 7 recomendaciones médicas específicas, prácticas y accionables para mejorar su salud cardiovascular.

  Datos del Paciente:
  - Nombre: ${paciente.nombre_completo}
  - Edad: ${paciente.edad} años
  - Sexo: ${paciente.sexo}
  - Presión arterial: ${evaluacion.presion_sistolica}/${evaluacion.presion_diastolica} mmHg
  - Colesterol total: ${evaluacion.colesterol_total} mg/dL
  - Glucosa: ${evaluacion.glucosa} mg/dL
  - IMC: ${evaluacion.imc}
  
  Resultados del Algoritmo:
  - Nivel de riesgo: ${resultado.nivel_riesgo}
  - Riesgo estimado a 10 años: ${resultado.riesgo_estimado}%
  - Enfermedades detectadas/Factores: ${JSON.stringify(resultado.enfermedades_detectadas)}

  Instrucciones de salida:
  - Devuelve SOLAMENTE un array JSON válido de strings.
  - Ejemplo: ["Recomendación 1", "Recomendación 2", ...]
  - No incluyas markdown, ni la palabra "json", ni texto adicional. Solo el array crudo.
  `;

  let recomendaciones = [
    "Consulta médica inmediata para evaluación más profunda.",
    "Control de presión arterial.",
    "Dieta baja en grasas saturadas y azúcares.",
    "Incrementar actividad física supervisada (mínimo 150 minutos por semana).",
    "Chequeos trimestrales de colesterol y glucosa.",
  ];

  const DEBUG = process.env.DEBUG_PDF === "true";

  if (!DEBUG) {
    try {
      const client = new OpenAI();
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente médico cardiólogo experto. Respondes solo con arrays JSON válidos.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;

      // Intentar limpiar el string si viene con bloques de código markdown
      const cleanContent = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedRecomendaciones = JSON.parse(cleanContent);

      if (
        Array.isArray(parsedRecomendaciones) &&
        parsedRecomendaciones.length > 0
      ) {
        recomendaciones = parsedRecomendaciones;
      }
    } catch (error) {
      console.warn("Error generating AI report:", error.message);
      // Mantiene las recomendaciones por defecto si falla
    }
  }

  /* ============================================================
     2. CREAR PDF: SOPORTE PARA MODO DEBUG
  ============================================================ */

  let doc;
  let chunks = [];

  if (DEBUG) {
    console.log("🔍 MODO DEBUG ACTIVADO → Generando ./debug_reporte.pdf");

    const fs = await import("fs");
    doc = new PDFDocument({ margin: 40 });

    // Guardar archivo local para pruebas
    doc.pipe(fs.createWriteStream("./debug_reporte.pdf"));
  } else {
    // Producción → PDF a buffer
    doc = new PDFDocument({ margin: 40 });

    doc.on("data", (c) => chunks.push(c));
  }

  /* ============================================================
     3. COMENZAR A DIBUJAR EL PDF
  ============================================================ */

  // ---------------------------
  // ENCABEZADO
  // ---------------------------
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Reporte de Análisis Cardiovascular – Sistema Asistido por IA", {
      align: "center",
    });

  doc.moveDown();
  doc.font("Helvetica").fontSize(12);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`);
  doc.text(`ID de paciente: ${paciente.id_paciente}`);
  doc.moveDown(2);

  // ---------------------------
  // DATOS DEL PACIENTE
  // ---------------------------
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Datos del paciente", { underline: true });
  doc.moveDown();

  const datosPacienteTable = {
    headers: ["Parámetro", "Valor ingresado"],
    rows: [
      ["Nombre", paciente.nombre_completo],
      ["Edad", `${paciente.edad} años`],
      ["Sexo", paciente.sexo],
      [
        "Presión arterial",
        `${evaluacion.presion_sistolica}/${evaluacion.presion_diastolica} mmHg`,
      ],
      ["Colesterol total", `${evaluacion.colesterol_total} mg/dL`],
      ["Glucosa en sangre", `${evaluacion.glucosa} mg/dL`],
      ["Índice de masa corporal", evaluacion.imc],
    ],
  };

  // drawStyledTable(doc, datosPacienteTable, 40, doc.y + 10, [200, 260]);
  doc.table(datosPacienteTable);
  doc.moveDown(2);

  // ---------------------------
  // RESULTADOS DEL ANÁLISIS
  // ---------------------------
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Resultados del análisis automatizado", { underline: true });
  doc.moveDown();

  const resultadosTable = {
    headers: [
      "Indicador",
      "Valor obtenido",
      "Rango de referencia",
      "Observación",
    ],
    rows: [
      [
        "Presión arterial",
        `${evaluacion.presion_sistolica}/${evaluacion.presion_diastolica} mmHg`,
        "< 120/80 mmHg",
        "Elevado",
      ],
      ["Frecuencia cardiaca", "—", "60–100 lpm", "Normal"],
      [
        "Colesterol total",
        `${evaluacion.colesterol_total} mg/dl`,
        "< 200 mg/dl",
        evaluacion.colesterol_total >= 200 ? "Riesgo elevado" : "Normal",
      ],
      [
        "Glucosa en sangre",
        `${evaluacion.glucosa} mg/dl`,
        "70–110 mg/dl",
        evaluacion.glucosa > 110 ? "Límite superior" : "Normal",
      ],
      [
        "IMC",
        evaluacion.imc,
        "18.5–24.9",
        evaluacion.imc >= 25 ? "Sobrepeso" : "Normal",
      ],
    ],
  };

  doc.table(resultadosTable);
  // drawStyledTable(doc, resultadosTable, 40, doc.y + 10, [120, 120, 140, 140]);
  doc.moveDown(2);

  // ---------------------------
  // EVALUACIÓN DE RIESGO
  // ---------------------------
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Evaluación de riesgo cardiovascular (IA)");
  doc.moveDown();

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      `Riesgo estimado de enfermedad cardiovascular a 10 años: ${resultado.riesgo_estimado || "N/A"}% (${resultado.nivel_riesgo})`
    );

  doc.text(
    "El modelo de IA calcula este porcentaje a partir de los parámetros ingresados."
  );
  doc.moveDown(2);

  // ---------------------------
  // RECOMENDACIONES
  // ---------------------------
  doc.font("Helvetica-Bold").fontSize(16).text("Recomendaciones preliminares");
  doc.moveDown();

  recomendaciones.forEach((r) => doc.fontSize(12).text("• " + r));
  doc.moveDown(2);

  // ---------------------------
  // AVISO LEGAL
  // ---------------------------
  doc
    .font("Helvetica-Oblique")
    .fontSize(12)
    .text(
      "Aviso importante: Este reporte es un análisis preliminar generado por inteligencia artificial y no reemplaza una evaluación médica profesional. El paciente debe consultar a un especialista para confirmar el diagnóstico y determinar el tratamiento adecuado.",
      { align: "justify" }
    );

  // 🔚 Cerrar PDF
  doc.end();

  /* ============================================================
     4. SUBIR A SUPABASE (SOLO SI NO ES DEBUG)
  ============================================================ */
  if (DEBUG) return "./debug_reporte.pdf";

  return await new Promise((resolve, reject) => {
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);

        const fileName = `reporte_${Date.now()}.pdf`;
        const path = `reports/paciente_${paciente.id_paciente}/${fileName}`;

        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase.storage
          .from("expedientes")
          .upload(path, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (error) return reject(error);

        const { data: publicUrl } = supabase.storage
          .from("expedientes")
          .getPublicUrl(path);

        resolve(publicUrl.publicUrl);
      } catch (err) {
        reject(err);
      }
    });
  });
}
