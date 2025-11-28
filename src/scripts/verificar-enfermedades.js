// Script para verificar cómo se están guardando las enfermedades detectadas
import { prisma } from "./src/config/prismaClient.js";

async function verificarEnfermedades() {
  try {
    console.log("🔍 Verificando datos en resultado_ia...\n");

    // Obtener los últimos 5 resultados
    const resultados = await prisma.resultado_ia.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        evaluacion_clinica: {
          include: {
            paciente: true,
          },
        },
      },
    });

    if (resultados.length === 0) {
      console.log("❌ No hay resultados en la tabla resultado_ia");
      return;
    }

    console.log(`✅ Encontrados ${resultados.length} resultados\n`);

    resultados.forEach((resultado, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Resultado #${index + 1} (ID: ${resultado.id_resultado})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      if (resultado.evaluacion_clinica?.paciente) {
        console.log(
          `👤 Paciente: ${resultado.evaluacion_clinica.paciente.nombre_completo}`
        );
      }

      console.log(`📈 Riesgo estimado: ${resultado.riesgo_estimado}`);
      console.log(`⚠️  Nivel de riesgo: ${resultado.nivel_riesgo}`);
      console.log(`🤖 Modelo versión: ${resultado.modelo_version}`);

      console.log(`\n🦠 Enfermedades detectadas:`);
      console.log(`   Tipo: ${typeof resultado.enfermedades_detectadas}`);
      console.log(
        `   Valor: ${JSON.stringify(resultado.enfermedades_detectadas, null, 2)}`
      );

      // Verificar si es null o vacío
      if (!resultado.enfermedades_detectadas) {
        console.log(
          `   ⚠️  ADVERTENCIA: enfermedades_detectadas está vacío o null`
        );
      } else {
        // Intentar parsear si es string
        try {
          const enfermedades =
            typeof resultado.enfermedades_detectadas === "string"
              ? JSON.parse(resultado.enfermedades_detectadas)
              : resultado.enfermedades_detectadas;

          console.log(`   ✅ Estructura parseada correctamente`);

          if (Array.isArray(enfermedades)) {
            console.log(
              `   📋 Es un array con ${enfermedades.length} elementos`
            );
            enfermedades.forEach((enf, i) => {
              console.log(
                `      ${i + 1}. ${enf.nombre || "Sin nombre"}: ${enf.probabilidad || "Sin probabilidad"}`
              );
            });
          } else if (typeof enfermedades === "object") {
            console.log(`   📋 Es un objeto con las siguientes claves:`);
            Object.entries(enfermedades).forEach(([key, value]) => {
              console.log(`      - ${key}: ${value}`);
            });
          }
        } catch (error) {
          console.log(`   ❌ Error al parsear: ${error.message}`);
        }
      }
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarEnfermedades();
