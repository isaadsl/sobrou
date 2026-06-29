# Sobrou — Visualize, planeje e economize.

Aplicativo completo de planejamento financeiro pessoal, com contas individuais,
banco de dados na nuvem (Supabase) e um Assistente Financeiro com Inteligência
Artificial integrado aos seus dados reais.

- **Frontend:** React + Vite + Recharts
- **Autenticação e banco de dados:** Supabase (PostgreSQL + Auth + RLS)
- **Backend:** Node.js + Express — usado **apenas** para a rota do Assistente IA
- **Tema:** Dark mode preto e vermelho

## 🧠 Assistente Financeiro IA

A página **Assistente IA** funciona como um chat:

1. Antes de cada pergunta, o app monta automaticamente um resumo da sua
   situação financeira atual (saldo, receitas, despesas, contas pendentes,
   metas, planejamento do próximo salário)
2. Esse resumo + sua pergunta são enviados ao backend, que chama a API do
  Groq com um prompt de sistema específico para consultoria financeira
3. A resposta é salva no banco (`conversas_ia`), então seu histórico de
   conversas continua disponível mesmo depois de fechar e reabrir o app

### Modo Simulação de Compra

O botão **"Simular compra"** pergunta o item e o valor, e formula
automaticamente uma pergunta estruturada para a IA calcular o impacto da
compra no seu saldo e nas contas futuras.

## 🌱 Perfil Financeiro Automático

Depois de alguns dias de uso (mínimo 5 dias de conta), o Sobrou calcula
silenciosamente, em segundo plano, se você tem um perfil:

- **🌱 Econômico** — guarda uma boa parte do que recebe e paga as contas em dia
- **⚖️ Equilibrado** — gastos e receitas relativamente parelhos
- **🔥 Gastador** — os gastos tendem a consumir quase toda (ou mais que) a renda

Esse cálculo usa a taxa média de economia dos últimos 3 meses e a taxa de
pontualidade no pagamento de despesas (veja
`src/services/perfilComportamental.js`). O resultado é salvo em
`profiles.perfil_comportamental` e usado para personalizar o tom das respostas
do Assistente IA — alguém com perfil "gastador" recebe alertas mais diretos
sobre riscos, enquanto alguém "econômico" recebe incentivo para metas mais
ambiciosas.

Esse perfil é recalculado a cada vez que o app abre (de forma silenciosa, sem
travar a interface).

## 🧭 Páginas do aplicativo

| Página | Acesso | O que faz |
|---|---|---|
| Boas-vindas / Login / Cadastro | Público | Entrada no app |
| Painel | Privado | Saldo, carteira digital, próximas contas |
| Receitas / Despesas | Privado | Cadastro com categorias e prioridades |
| Planejamento Mensal | Privado | Saldo projetado para o fim do mês |
| Próximo Salário | Privado | Simula gastos antes de receber |
| Calendário | Privado | Visão mensal de recebimentos e vencimentos |
| Relatórios | Privado | Gráficos de evolução e gastos por categoria |
| Metas | Privado | Objetivos financeiros com progresso |
| **Assistente IA** | Privado | Chat com IA + histórico + simulação de compra |
| **Perfil** | Privado | Dados da conta, perfil comportamental, logout |
| **Sobre** | Privado | Identidade e propósito do aplicativo |

## 🔮 Próximos passos sugeridos

- Login por número de telefone com SMS
- Login e cadastro com Google
- Empacotar como app mobile com Capacitor, reaproveitando todo este frontend
- Upload de foto de perfil usando o Supabase Storage
