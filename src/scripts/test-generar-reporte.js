// Test del endpoint POST /api/reportes/generar
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGUiOjEsImlhdCI6MTc2Mzg1OTc1Nn0.kBS4z1wFZ9xTwI-FE4A-Mq6Miiun8FDng183KL2BPlw";

const datosEvaluacion = {
  usuario_id: 5,
  nombre_completo: "María González Test",
  edad: 62,
  sexo: "Femenino",
  fecha_nacimiento: "1962-03-15",
  telefono: "555-0123",
  email: "maria.test@example.com",
  presion_sistolica: 150,
  presion_diastolica: 98,
  colesterol_total: 250,
  colesterol_hdl: 38,
  colesterol_ldl: 170,
  glucosa: 125,
  tabaquismo: true,
  consumo_alcohol: "Frecuente",
  actividad_fisica: "Sedentario",
  antecedentes_familiares: true,
  peso_kg: 78,
  altura_cm: 160,
  imc: 30.5,
  sintomas: "Dolor en el pecho al hacer esfuerzo, fatiga constante",
};

async function testGenerarReporte() {
  try {
    console.log("🧪 Probando POST /api/reportes/generar...\n");
    console.log("📋 Datos de la evaluación:");
    console.log(JSON.stringify(datosEvaluacion, null, 2));
    console.log("\n⏳ Enviando solicitud...\n");

    const response = await fetch("http://localhost:3000/api/reportes/generar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datosEvaluacion),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (response.ok) {
      console.log("\n✅ ÉXITO! Reporte generado correctamente\n");
      console.log("📄 Respuesta del servidor:");
      console.log(JSON.stringify(data, null, 2));

      if (data.url) {
        console.log(`\n📎 URL del PDF: ${data.url}`);
      }
    } else {
      console.log("\n❌ ERROR en la solicitud\n");
      console.log("Respuesta del servidor:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("\n❌ Error en la prueba:", error.message);
    console.error("Stack:", error.stack);
  }
}

testGenerarReporte();
