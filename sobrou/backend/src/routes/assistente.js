import express from "express";

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.post("/simular", async (req, res) => {
  const { produto, valor } = req.body;

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "Você é um assistente financeiro." },
          { role: "user", content: `Quero simular a compra de ${produto} no valor de R$${valor}.` }
        ],
        max_tokens: 800,
        reasoning_effort: "low"
      })
    });

    const dados = await resposta.json();
    res.json({ mensagem: dados.choices[0].message.content });
  } catch (erro) {
    console.error("Erro na simulação:", erro);
    res.status(500).json({ erro: "Falha ao simular compra" });
  }
});

router.post('/perguntar', async (req, res) => {
  const { pergunta, contexto, perfilComportamental } = req.body;

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "Você é um assistente financeiro chamado Sobrou. Responda de forma breve, clara e objetiva, em até 3 frases." },
          { role: "user", content: `Pergunta: ${pergunta}\nContexto: ${JSON.stringify(contexto)}\nPerfil: ${perfilComportamental}` }
        ],
        max_tokens: 800,
        reasoning_effort: "low"
      })
    });

    const data = await resposta.json();
    console.log(JSON.stringify(data, null, 2));

    const texto = data.choices?.[0]?.message?.content || "Não consegui gerar resposta.";
    return res.json({ resposta: texto });

  } catch (erro) {
    console.error("Erro ao consultar Groq:", erro);
    return res.status(500).json({ erro: "Erro ao consultar o assistente." });
  }
});

export default router;