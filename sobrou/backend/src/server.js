import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import assistenteRoutes from './routes/assistente.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Em desenvolvimento, o frontend roda em localhost:5173.
// Em produção, o frontend é publicado no GitHub Pages sob o domínio abaixo.
// Ajuste ou adicione outras origens aqui se o frontend for publicado em outro lugar.
const origensPermitidas = [
  'http://localhost:5173',
  'https://isaadsl.github.io',
  'https://isaadsl.github.io/sobrou', // importante para o GitHub Pages
];

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

// Rota de saúde para testar se o backend está ativo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ia_configurada: !!process.env.GROQ_API_KEY });
});

// Rotas do assistente
app.use('/api/assistente', assistenteRoutes);

// Tratamento de erros inesperados
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor do Assistente IA rodando na porta ${PORT}`);
  console.log(
    process.env.GROQ_API_KEY
      ? 'Chave da Groq encontrada — IA pronta para uso.'
      : 'GROQ_API_KEY não configurada. Configure no Render para ativar o Assistente Financeiro.'
  );
});
