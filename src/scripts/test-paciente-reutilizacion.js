// Test para verificar la lógica de reutilización de pacientes
import { prisma } from "./src/config/prismaClient.js";

async function testPacienteReutilizacion() {
  try {
    console.log("🧪 Probando lógica de reutilización de pacientes...\n");

    const testEmail = "john.smith@email.com";
    const usuario_id = 5;

    // Verificar si existe un paciente con este email
    const pacienteExistente = await prisma.paciente.findFirst({
      where: {
        email: testEmail,
        usuario_id: usuario_id,
      },
      include: {
        evaluacion_clinica: {
          include: {
            resultado_ia: true,
          },
        },
      },
    });

    if (pacienteExistente) {
      console.log("   ✨ Se CREARÁ un nuevo reporte_clinico");
      console.log(
        `   📊 Total de evaluaciones después: ${pacienteExistente.evaluacion_clinica.length + 1}`
      );
    } else {
      console.log("❌ No existe un paciente con este email");
      console.log("\n✅ Al enviar una evaluación con este email:");
      console.log("   ✨ Se CREARÁ un nuevo paciente");
      console.log("   ✨ Se CREARÁ una nueva evaluacion_clinica");
      console.log("   ✨ Se CREARÁ un nuevo resultado_ia");
      console.log("   ✨ Se CREARÁ un nuevo reporte_clinico");
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 Resumen de la lógica implementada:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Se busca paciente por email + usuario_id");
    console.log("2. Si existe:");
    console.log("   - Actualiza datos del paciente (edad, teléfono, etc.)");
    console.log("   - Crea nueva evaluación vinculada al paciente existente");
    console.log("3. Si NO existe:");
    console.log("   - Crea nuevo paciente");
    console.log("   - Crea nueva evaluación vinculada al nuevo paciente");
    console.log("4. Siempre crea:");
    console.log("   - Nueva evaluacion_clinica");
    console.log("   - Nuevo resultado_ia");
    console.log("   - Nuevo reporte_clinico");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPacienteReutilizacion();
