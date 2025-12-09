import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import pacienteRoutes from "./routes/paciente.routes.js";
import evaluacionRoutes from "./routes/evaluacion.routes.js";
import resultadoRoutes from "./routes/resultado.routes.js";
import systemlogRoutes from "./routes/systemlog.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import reporteRoutes from "./routes/reporte.routes.js";
import alertasRoutes from "./routes/alerts.routes.js";

const app = express();
// const options = {
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API Running"));
app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/evaluaciones", evaluacionRoutes);
app.use("/api/resultados", resultadoRoutes);
app.use("/api/system-logs", systemlogRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/alertas", alertasRoutes);
app.use(errorHandler);

export default app;
