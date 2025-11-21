import { prisma } from '../config/prismaClient.js';
export async function getResultado(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resultado = await prisma.resultadoIA.findUnique({
      where: { id_resultado: id },
      include: { evaluacion: true }
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
