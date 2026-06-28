import { Router } from 'express';

const router = Router();

const MODELO = 'claude-sonnet-4-6';

function montarPromptSistema(contexto, perfilComportamental) {
  const descricoesPerfil = {
    economico: 'A pessoa tem um perfil ECONÔMICO: costuma guardar boa parte do que recebe e paga as contas em dia. Reforce esses bons hábitos e incentive metas mais ambiciosas quando fizer sentido.',
    equilibrado: 'A pessoa tem um perfil EQUILIBRADO: gastos e receitas relativamente parelhos. Ajude a encontrar pequenos ajustes que liberem mais espaço de economia.',
    gastador: 'A pessoa tem um perfil GASTADOR: os gastos tendem a consumir quase toda (ou mais que) a renda. Seja gentil mas direto ao apontar riscos, e sugira cortes ou priorizações concretas.',
  };

  return `Você é o Assistente Financeiro do app "Sobrou" — um app de planejamento financeiro pessoal brasileiro.

Seu papel é responder perguntas financeiras do usuário de forma curta, direta, prática e em português do Brasil, usando SEMPRE os dados financeiros reais fornecidos abaixo. Nunca invente números — baseie-se exclusivamente no contexto financeiro fornecido.

${descricoesPerfil[perfilComportamental] || descricoesPerfil.equilibrado}

CONTEXTO FINANCEIRO ATUAL DO USUÁRIO:
${JSON.stringify(contexto, null, 2)}

Diretrizes de resposta:
- Seja objetivo: 2 a 5 frases na maioria dos casos.
- Use valores em reais formatados (ex: R$ 1.200,00).
- Se a pergunta envolver uma simulação de compra, calcule o saldo antes/depois explicitamente.
- Se não houver dados suficientes para responder com precisão, diga isso claramente em vez de chutar.
- Nunca dê conselhos de investimento específicos (ações, criptomoedas etc.) — foque em orçamento, prioridades e metas.
- Não use markdown pesado (sem títulos ##); pode usar **negrito** pontual e listas curtas quando ajudar a clareza.`;
}

// POST /api/assistente/perguntar
router.post('/perguntar', async (req, res) => {
  const { pergunta, contexto, perfilComportamental, historico } = req.body;

  if (!pergunta || !contexto) {
    return res.status(400).json({ erro: 'Campos obrigatórios: pergunta, contexto' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      erro: 'IA ainda não configurada. Defina ANTHROPIC_API_KEY no arquivo backend/.env para ativar o Assistente Financeiro.',
    });
  }

  try {
    const promptSistema = montarPromptSistema(contexto, perfilComportamental);

    const mensagens = [
      ...(historico || []).map((h) => [
        { role: 'user', content: h.pergunta },
        { role: 'assistant', content: h.resposta },
      ]).flat(),
      { role: 'user', content: pergunta },
    ];
    return res.status(503).json({
      erro: 'IA ainda não configurada. Defina ANTHROPIC_API_KEY no arquivo backend/.env e descomente a chamada em src/routes/assistente.js.',
    });
  } catch (erro) {
    console.error('Erro ao consultar IA:', erro);
    return res.status(500).json({ erro: 'Erro ao consultar o assistente financeiro.' });
  }
});

export default router;
