// Script de prueba para el endpoint GET /api/reportes/:reportId
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testReporteEndpoint() {
  try {
    // Paso 1: Login para obtener token
    console.log("🔐 Intentando login...");
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo: "doctor@cardioriesgo.com",
        contrasena: "doctor123",
      }),
    });

    if (!loginResponse.ok) {
      // Intentar con credenciales alternativas
      console.log(
        "⚠️  Primer intento falló, probando credenciales alternativas..."
      );
      const altLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: "admin@example.com",
          contrasena: "admin123",
        }),
      });

      if (!altLoginResponse.ok) {
        throw new Error("No se pudo autenticar con ninguna credencial");
      }

      const altLoginData = await altLoginResponse.json();
      var token = altLoginData.token;
    } else {
      const loginData = await loginResponse.json();
      var token = loginData.token;
    }

    console.log("✅ Login exitoso!");
    console.log("Token:", token.substring(0, 20) + "...\n");

    // Paso 2: Probar el endpoint de reportes
    console.log("📊 Probando endpoint GET /api/reportes/1...");
    const reporteResponse = await fetch(`${BASE_URL}/api/reportes/1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Status:", reporteResponse.status);
    const reporteData = await reporteResponse.json();

    if (reporteResponse.ok) {
      console.log("\n✅ ÉXITO! Datos del reporte:\n");
      console.log(JSON.stringify(reporteData, null, 2));

      // Verificar campos requeridos
      console.log("\n📋 Verificación de campos:");
      const camposRequeridos = [
        "id_reporte",
        "id_paciente",
        "nombre_completo",
        "fecha_reporte",
        "edad",
        "sexo",
        "imc",
        "presion_sistolica",
        "presion_diastolica",
        "colesterol_total",
        "colesterol_ldl",
        "colesterol_hdl",
        "glucosa",
        "tabaquismo",
        "consumo_alcohol",
        "actividad_fisica",
        "antecedentes_familiares",
        "sintomas",
        "puntuacion_riesgo",
        "enfermedades",
        "url_pdf",
      ];

      camposRequeridos.forEach((campo) => {
        const existe = reporteData.hasOwnProperty(campo);
        console.log(
          `  ${existe ? "✅" : "❌"} ${campo}: ${existe ? "✓" : "FALTA"}`
        );
      });
    } else {
      console.log("\n❌ ERROR:", reporteData);
    }
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
}

testReporteEndpoint();
