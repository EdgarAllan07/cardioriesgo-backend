import axios from 'axios';
export const aiClient = {
  async analizarEvaluacion(evaluacion) {
    try {
      const url = process.env.AI_API_URL;
      if (!url) return {};
      console.log(evaluacion)
      const { data } = await axios.post(url, evaluacion, { timeout: 8000 });
      return data;
    } catch (err) {
      console.error('AI client error', err.message);
      return {};
    }
  }
};
