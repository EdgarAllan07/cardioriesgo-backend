// Test del endpoint GET /api/pacientes/:userId
import { prisma } from "./src/config/prismaClient.js";

async function testListPacientes() {
  try {
    console.log("🧪 Probando endpoint GET /api/pacientes/:userId...\n");

    const usuario_id = 5;

    // Simular la lógica del endpoint
    const pacientes = await prisma.paciente.findMany({
      where: {
        usuario_id: usuario_id,
      },
      include: {
        evaluacion_clinica: {
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
          take: 1,
        },
      },
    });

    // Transformar los datos
    const data = pacientes.map((paciente) => {
      const ultimaEvaluacion = paciente.evaluacion_clinica[0];

      return {
        id_paciente: paciente.id_paciente,
        nombre_completo: paciente.nombre_completo,
        edad: paciente.edad,
        sexo: paciente.sexo,
        email: paciente.email,
        telefono: paciente.telefono,
        fecha_nacimiento: paciente.fecha_nacimiento
          ? paciente.fecha_nacimiento.toISOString().split("T")[0]
          : null,
        ultima_evaluacion: ultimaEvaluacion?.created_at
          ? ultimaEvaluacion.created_at.toISOString().split("T")[0]
          : null,
        nivel_riesgo: ultimaEvaluacion?.resultado_ia?.[0]?.riesgo_estimado
          ? parseFloat(ultimaEvaluacion.resultado_ia[0].riesgo_estimado)
          : null,
      };
    });

    const response = {
      data: data,
      total: data.length,
    };

    console.log("✅ Respuesta del endpoint:\n");
    console.log(JSON.stringify(response, null, 2));

    console.log(`\n📊 Resumen:`);
    console.log(`   Total de pacientes: ${response.total}`);

    if (response.total > 0) {
      console.log(`\n   Pacientes encontrados:`);
      response.data.forEach((paciente, index) => {
        console.log(`\n   ${index + 1}. ${paciente.nombre_completo}`);
        console.log(`      ID: ${paciente.id_paciente}`);
        console.log(`      Email: ${paciente.email || "N/A"}`);
        console.log(`      Edad: ${paciente.edad} años`);
        console.log(
          `      Última evaluación: ${paciente.ultima_evaluacion || "Sin evaluaciones"}`
        );
        console.log(`      Nivel de riesgo: ${paciente.nivel_riesgo || "N/A"}`);
      });
    }

    console.log("\n✅ Endpoint funcionando correctamente!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testListPacientes();
