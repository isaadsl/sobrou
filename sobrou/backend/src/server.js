import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import assistenteRoutes from './routes/assistente.js';

const app = express();
const PORT = process.env.PORT || 3001;

const origensPermitidas = [
  'http://localhost:5173',
  'https://isaadsl.github.io',
  'https://isaadsl.github.io/sobrou',
];

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ia_configurada: !!process.env.GROQ_API_KEY });
});


app.use('/api/assistente', assistenteRoutes);


app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(
    process.env.GROQ_API_KEY
      ? 'Chave da Groq encontrada — IA pronta para uso.'
      : 'GROQ_API_KEY não configurada. Configure no Render para ativar o Assistente Financeiro.'
  );
});
