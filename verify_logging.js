import { prisma } from "../config/prismaClient.js";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

async function verify() {
  console.log("Starting verification...");

  // 1. Create a test user directly in DB (to bypass auth requirement for creation)
  const email = `test_${Date.now()}@example.com`;
  const password = "password123";

  console.log("Creating user via Prisma...");
  let createdUser;
  try {
    createdUser = await prisma.usuario.create({
      data: {
        nombre: "Test",
        apellido: "User",
        correo: email,
        contrasena_hash: password,
        tipo_usuario_id: 1, // Admin
        estado: 1,
      },
    });
    console.log("User created:", createdUser.id_usuario);
  } catch (e) {
    console.error("Failed to create user via Prisma:", e);
    return;
  }

  // 2. Login
  console.log("Logging in...");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      correo: email,
      contrasena: password,
    }),
  });

  if (!loginRes.ok) {
    console.error("Failed to login:", await loginRes.text());
    return;
  }
  const loginData = await loginRes.json();
  console.log(
    "Login successful, token:",
    loginData.token ? "Received" : "Missing"
  );

  // 3. List users
  console.log("Listing users...");
  const listRes = await fetch(`${BASE_URL}/usuarios`, {
    headers: {
      Authorization: `Bearer ${loginData.token}`,
    },
  });
  if (!listRes.ok) {
    console.error("Failed to list users:", await listRes.text());
    return;
  }
  console.log("Users listed.");

  // 4. Update Password (to test the new log)
  console.log("Updating password...");
  const updatePassRes = await fetch(
    `${BASE_URL}/usuarios/contrasena/${createdUser.id_usuario}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({
        contrasena_hash: "newpassword123",
      }),
    }
  );

  if (!updatePassRes.ok) {
    console.error("Failed to update password:", await updatePassRes.text());
  } else {
    console.log("Password updated.");
  }

  // 5. Check System Logs
  console.log("Checking system logs...");
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

  const logs = await prisma.system_log.findMany({
    orderBy: { fecha: "desc" },
    take: 20,
    include: { accion_sistema: true },
  });

  console.log("Recent Logs:");
  logs.forEach((log) => {
    console.log(
      `[${log.fecha.toISOString()}] Action: ${log.accion_sistema.nombre_accion} | User: ${log.id_usuario} | Origin: ${log.origen}`
    );
  });

  const foundLogin = logs.find(
    (l) =>
      l.accion_sistema.nombre_accion === "login" &&
      l.id_usuario === createdUser.id_usuario
  );
  // Note: We didn't use the API to create the user, so "crear_usuario" log won't exist for this user.
  // But we can check if "ver_usuarios" exists.
  const foundList = logs.find(
    (l) =>
      l.accion_sistema.nombre_accion === "ver_usuarios" &&
      l.id_usuario === createdUser.id_usuario
  );

  const foundUpdatePass = logs.find(
    (l) =>
      l.accion_sistema.nombre_accion === "actualizar_contrasena_usuario" &&
      l.id_usuario === createdUser.id_usuario
  );

  if (foundLogin) console.log("✅ Login log found");
  else console.error("❌ Login log NOT found");

  if (foundList) console.log("✅ List users log found");
  else console.error("❌ List users log NOT found");

  if (foundUpdatePass) console.log("✅ Update password log found");
  else console.error("❌ Update password log NOT found");

  // Cleanup
  console.log("Cleaning up...");
  // Delete logs first to avoid foreign key constraint error
  await prisma.system_log.deleteMany({
    where: { id_usuario: createdUser.id_usuario },
  });
  await prisma.usuario.delete({
    where: { id_usuario: createdUser.id_usuario },
  });
}

verify().catch(console.error);
