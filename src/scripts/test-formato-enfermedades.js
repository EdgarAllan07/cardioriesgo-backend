// Script para probar el endpoint con el formato corregido de enfermedades
import { prisma } from "./src/config/prismaClient.js";

async function probarFormatoEnfermedades() {
  try {
    console.log("🧪 Probando transformación de enfermedades...\n");

    // Buscar un reporte que tenga enfermedades detectadas
    const reporte = await prisma.reporte_clinico.findFirst({
      where: {
        resultado_ia: {
          enfermedades_detectadas: {
            not: null,
          },
        },
      },
      include: {
        resultado_ia: {
          include: {
            evaluacion_clinica: {
              include: {
                paciente: true,
              },
            },
          },
        },
      },
    });

    if (!reporte || !reporte.resultado_ia) {
      console.log("❌ No se encontró un reporte con enfermedades detectadas");
      return;
    }

    console.log(`✅ Reporte encontrado: ID ${reporte.id_reporte}`);
    console.log(
      `   Paciente: ${reporte.resultado_ia.evaluacion_clinica.paciente.nombre_completo}\n`
    );

    const resultado = reporte.resultado_ia;

    console.log("📊 Datos originales en BD:");
    console.log(JSON.stringify(resultado.enfermedades_detectadas, null, 2));

    // Aplicar la misma transformación que el endpoint
    let enfermedades = [];
    if (resultado.enfermedades_detectadas) {
      const enfermedadesData =
        typeof resultado.enfermedades_detectadas === "string"
          ? JSON.parse(resultado.enfermedades_detectadas)
          : resultado.enfermedades_detectadas;

      if (Array.isArray(enfermedadesData)) {
        enfermedades = enfermedadesData.map((item) => ({
          nombre: item.enfermedad || item.nombre || "Desconocida",
          probabilidad: item.probabilidad
            ? typeof item.probabilidad === "number" && item.probabilidad > 1
              ? item.probabilidad / 100
              : parseFloat(item.probabilidad)
            : 0,
        }));
      }
    }

    console.log("\n✨ Datos transformados para el frontend:");
    console.log(JSON.stringify(enfermedades, null, 2));

    console.log("\n📋 Resumen de enfermedades:");
    enfermedades.forEach((enf, i) => {
      console.log(
        `   ${i + 1}. ${enf.nombre}: ${(enf.probabilidad * 100).toFixed(0)}%`
      );
    });

    console.log("\n✅ Transformación completada exitosamente!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

probarFormatoEnfermedades();
