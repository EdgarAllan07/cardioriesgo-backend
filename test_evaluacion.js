import axios from "axios";

const payload = {
  usuario_id: 3,
  nombre_completo: "Manuel Ramirez",
  edad: 52,
  sexo: "Masculino",
  dui: "01234567-8",
  fecha_nacimiento: "1973-04-10",
  telefono: "7777-8888",
  email: "manuel.ramiez@correo.com",
  presion_sistolica: 145,
  presion_diastolica: 95,
  colesterol_total: 240,
  colesterol_ldl: 130,
  colesterol_hdl: 50,
  glucosa: 115,
  peso_kg: 85.5,
  altura_cm: 175,
  imc: 27.9,
  tabaquismo: true,
  consumo_alcohol: "Moderado",
  actividad_fisica: "Sedentario",
  antecedentes_familiares: true,
  sintomas: "Dolor en el pecho, Fatiga",
};

async function testRoute() {
  try {
    console.log("Sending request to http://localhost:3000/api/evaluaciones...");
    const response = await axios.post(
      "http://localhost:3000/api/evaluaciones",
      payload
    );
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
  }
}

testRoute();
