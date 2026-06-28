import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import assistenteRoutes from './routes/assistente.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Em desenvolvimento, o frontend roda em localhost:5173. Em produção, o
// frontend é publicado no GitHub Pages sob o domínio abaixo. Ajuste ou
// adicione outras origens aqui se o frontend for publicado em outro lugar.
const origensPermitidas = [
  'http://localhost:5173',
  'https://isaadsl.github.io',
];

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ia_configurada: !!process.env.ANTHROPIC_API_KEY });
});

app.use('/api/assistente', assistenteRoutes);

app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor do Assistente IA rodando em http://localhost:${PORT}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? 'Chave da Anthropic encontrada — IA pronta para uso (lembre de descomentar a chamada em routes/assistente.js).'
      : 'ANTHROPIC_API_KEY não configurada. Crie backend/.env com sua chave para ativar o Assistente Financeiro.'
  );
});
