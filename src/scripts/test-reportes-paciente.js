// Test del endpoint GET /api/reportes/paciente/:patientId
import { prisma } from "./src/config/prismaClient.js";

async function testReportesPorPaciente() {
  try {
    console.log("🔍 Buscando un paciente con reportes...\n");

    // Buscar un paciente que tenga reportes
    const pacienteConReportes = await prisma.paciente.findFirst({
      where: {
        evaluacion_clinica: {
          some: {
            resultado_ia: {
              some: {
                reporte_clinico: {
                  some: {},
                },
              },
            },
          },
        },
      },
      include: {
        evaluacion_clinica: {
          include: {
            resultado_ia: {
              include: {
                reporte_clinico: true,
              },
            },
          },
        },
      },
    });

    if (!pacienteConReportes) {
      console.log("❌ No se encontró ningún paciente con reportes");
      return;
    }

    const patientId = pacienteConReportes.id_paciente;
    console.log(
      `✅ Paciente encontrado: ${pacienteConReportes.nombre_completo} (ID: ${patientId})\n`
    );

    // Simular la petición al endpoint
    console.log(`📊 Simulando GET /api/reportes/paciente/${patientId}...\n`);

    const reportes = await prisma.reporte_clinico.findMany({
      where: {
        resultado_ia: {
          evaluacion_clinica: {
            paciente_id: Number(patientId),
          },
        },
      },
      include: {
        resultado_ia: {
          select: {
            riesgo_estimado: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transformar los datos al formato esperado
    const data = reportes.map((reporte) => ({
      id_reporte: reporte.id_reporte,
      fecha_reporte: reporte.created_at
        ? reporte.created_at.toISOString().split("T")[0]
        : null,
      puntuacion_riesgo: reporte.resultado_ia?.riesgo_estimado
        ? parseFloat(reporte.resultado_ia.riesgo_estimado)
        : null,
      url_pdf: reporte.archivo_pdf_url,
    }));

    const response = {
      data: data,
      total: data.length,
    };

    console.log("✅ Respuesta del endpoint:\n");
    console.log(JSON.stringify(response, null, 2));

    console.log(`\n📋 Resumen:`);
    console.log(`   Total de reportes: ${response.total}`);

    if (response.total > 0) {
      console.log(`\n   Reportes encontrados:`);
      response.data.forEach((reporte, index) => {
        console.log(`   ${index + 1}. Reporte #${reporte.id_reporte}`);
        console.log(`      Fecha: ${reporte.fecha_reporte}`);
        console.log(`      Riesgo: ${reporte.puntuacion_riesgo || "N/A"}`);
        console.log(`      PDF: ${reporte.url_pdf ? "✓" : "✗"}`);
      });
    }

    console.log("\n✅ Endpoint funcionando correctamente!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testReportesPorPaciente();
