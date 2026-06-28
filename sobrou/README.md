# Sobrou — Visualize, planeje e economize.

Aplicativo completo de planejamento financeiro pessoal, com contas individuais,
banco de dados na nuvem (Supabase) e um Assistente Financeiro com Inteligência
Artificial integrado aos seus dados reais.

- **Frontend:** React + Vite + Recharts
- **Autenticação e banco de dados:** Supabase (PostgreSQL + Auth + RLS)
- **Backend:** Node.js + Express — usado **apenas** para a rota do Assistente IA
  (a chave da Anthropic nunca pode ficar exposta no navegador)
- **Tema:** Dark mode preto e vermelho

---

## 📦 Estrutura do projeto

```
financeapp/
├── supabase/
│   └── schema.sql        → script SQL com todas as tabelas e políticas RLS
│
├── backend/               → serve SOMENTE a rota do Assistente IA
│   └── src/
│       ├── routes/assistente.js
│       └── server.js
│
└── frontend/
    └── src/
        ├── contexto/AuthContext.jsx   → sessão, login, cadastro, logout
        ├── components/                → Layout, Modal, Cards, RotaProtegida...
        ├── paginas/
        │   ├── auth/                  → Boas-vindas, Login, Cadastro, Senha
        │   ├── Dashboard.jsx, Receitas.jsx, Despesas.jsx, ...
        │   ├── AssistenteIA.jsx       → chat com IA + histórico + simulação
        │   ├── Perfil.jsx             → dados da conta + perfil comportamental
        │   └── Sobre.jsx
        ├── services/
        │   ├── supabaseClient.js      → conexão com o Supabase
        │   ├── api.js                 → todas as operações de dados (CRUD)
        │   ├── contextoFinanceiro.js  → monta o contexto enviado à IA
        │   ├── perfilComportamental.js→ calcula econômico/equilibrado/gastador
        │   └── assistenteIA.js        → fala com o backend de IA
        └── utils/formatadores.js
```

---

## 🚀 Passo a passo completo

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **Start your project** → crie um projeto novo
2. Anote dois valores em **Project Settings → API**: a **Project URL** e a chave **anon public**

### 2. Rodar o script SQL

1. No painel do Supabase, abra **SQL Editor**
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**
3. Isso cria todas as tabelas (`profiles`, `receitas`, `despesas`, `metas`,
   `planejamento_proximo_salario`, `planejamento_itens`, `conversas_ia`,
   `historico_mensal`) já com **Row Level Security** habilitado — cada usuário
   só acessa seus próprios dados, mesmo que o código tenha algum bug.

Pode rodar esse script de novo no futuro sem problema: ele é seguro para
reexecução (`if not exists`, `drop policy if exists`, etc.).

### 3. Configurar login com Google (opcional, mas recomendado)

1. No [Google Cloud Console](https://console.cloud.google.com), crie um
   projeto e configure a tela de consentimento OAuth
2. Em **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Origens JavaScript autorizadas: `http://localhost:5173`
   - URI de redirecionamento: copie do Supabase em **Authentication → Providers
     → Google** (campo "Callback URL")
3. Cole o **Client ID** e **Client Secret** gerados pelo Google de volta no
   Supabase, na mesma tela do provedor Google, e ative o toggle

Se pular essa etapa, o login por e-mail/senha continua funcionando normalmente
— o botão "Entrar com Google" simplesmente retornará um erro até ser configurado.

### 4. Configurar o frontend

```bash
cd frontend
cp .env.example .env
```

Edite `frontend/.env` e cole:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

Depois instale e rode:

```bash
npm install
npm run dev
```

Acesse **http://localhost:5173** — você deve ver a tela de Boas-vindas do Sobrou.

### 5. Configurar o backend (Assistente IA)

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` e cole sua chave da Anthropic (gere uma em
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)):

```
ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
```

Depois:

```bash
npm install
npm run dev
```

**Importante:** mesmo com a chave configurada, é preciso descomentar o bloco de
chamada real à API em `backend/src/routes/assistente.js` (procure o comentário
`Chamada real à API da Anthropic`). Isso foi deixado comentado de propósito até
você ter a chave em mãos — depois de configurá-la, remova as marcações `/*` e
`*/` em torno do bloco `fetch(...)`.

Sem isso, o Assistente Financeiro mostra uma mensagem explicando que a IA
ainda não foi configurada, mas todo o resto do app funciona normalmente.

---

## 🔐 Como funciona a autenticação

- **Cadastro por e-mail:** cria a conta no Supabase Auth e, automaticamente
  (via trigger SQL), cria também a linha correspondente em `profiles`
- **Login com Google:** mesmo fluxo, só que via OAuth — a conta também é
  criada automaticamente no primeiro acesso
- **Sessão persistente:** o Supabase guarda a sessão no navegador; ao reabrir
  o app, você continua logado sem precisar digitar a senha de novo
- **Recuperação de senha:** o Supabase envia um e-mail com link de redefinição
  (usa o serviço de e-mail padrão do Supabase — funciona out-of-the-box, sem
  precisar configurar SMTP)
- **Row Level Security:** cada tabela tem uma política que restringe leitura e
  escrita ao próprio `user_id` / `auth.uid()`. Isso significa que, mesmo que
  alguém inspecione as chamadas de rede do navegador, não conseguiria ver
  dados de outra conta — a proteção está no banco, não só no código.

---

## 🧠 Assistente Financeiro IA

A página **Assistente IA** funciona como um chat:

1. Antes de cada pergunta, o app monta automaticamente um resumo da sua
   situação financeira atual (saldo, receitas, despesas, contas pendentes,
   metas, planejamento do próximo salário) — veja
   `src/services/contextoFinanceiro.js`
2. Esse resumo + sua pergunta são enviados ao backend, que chama a API da
   Anthropic com um prompt de sistema específico para consultoria financeira
3. A resposta é salva no banco (`conversas_ia`), então seu histórico de
   conversas continua disponível mesmo depois de fechar e reabrir o app

### Modo Simulação de Compra

O botão **"Simular compra"** pergunta o item e o valor, e formula
automaticamente uma pergunta estruturada para a IA calcular o impacto da
compra no seu saldo e nas contas futuras.

---

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

---

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

---

## 🌐 Publicando no GitHub Pages

O frontend já está configurado para ser publicado em
`https://isaadsl.github.io/SobrouWeb/`. Se o nome do repositório mudar, ajuste
o subcaminho nos três lugares abaixo (são intencionalmente independentes,
sem build step compartilhado):

1. `frontend/vite.config.js` → `base: '/NOVO-NOME/'`
2. `frontend/public/404.html` → `var caminhoBase = '/NOVO-NOME'`
3. `frontend/index.html` → `var caminhoBase = '/NOVO-NOME'`

### Por que existe um `404.html`

O GitHub Pages serve arquivos estáticos: cada rota do React Router (como
`/redefinir-senha`) só existe de fato no navegador, depois que o JavaScript
carrega. Se alguém acessa essa rota diretamente — por exemplo, clicando num
link de e-mail do Supabase — o GitHub Pages não encontra um arquivo físico
correspondente e devolve sua própria página de erro 404 em HTML puro, antes
do React ter qualquer chance de assumir.

O `404.html` deste projeto resolve isso: ele salva a rota solicitada,
redireciona para o `index.html`, e um pequeno script ali restaura a URL
original antes do React Router inicializar. É a técnica padrão para SPAs no
GitHub Pages.

### Configurando os redirects no Supabase

No painel do Supabase, em **Authentication → URL Configuration**:

- **Site URL:** `https://isaadsl.github.io/SobrouWeb/`
- **Redirect URLs:** adicione `https://isaadsl.github.io/SobrouWeb/**`

Sem isso, os links de confirmação de cadastro e recuperação de senha
continuam apontando para `localhost` (ou para onde a Site URL estiver
configurada), mesmo com o restante do código corrigido.

### Publicando o backend do Assistente IA

O GitHub Pages só serve arquivos estáticos — ele não executa o backend
Node.js da pasta `/backend`. Para o Assistente Financeiro funcionar no site
publicado, esse backend precisa estar rodando em algum serviço que execute
Node (Render, Railway, Fly.io são opções comuns e têm planos gratuitos
suficientes para esse uso). Depois de publicado:

1. Defina `ANTHROPIC_API_KEY` nas variáveis de ambiente desse serviço
2. Anote a URL pública gerada (ex: `https://sobrou-backend.onrender.com`)
3. No frontend, defina `VITE_API_URL` com essa URL antes do build de produção
4. Adicione o domínio do GitHub Pages à lista `origensPermitidas` em
   `backend/src/server.js`, caso ainda não esteja lá

Sem esses passos, o restante do app funciona normalmente — apenas o
Assistente IA mostra uma mensagem explicando que ainda não está disponível
naquele ambiente, em vez de travar com um erro técnico.

---

## 🛠️ Solução de problemas

**Erro "Usuário não autenticado" ou tela infinita de carregamento**
→ Confirme que `frontend/.env` está preenchido corretamente com a URL e a
anon key do seu projeto Supabase.

**Login com Google não funciona**
→ Confira se a Callback URL cadastrada no Google Cloud Console é
*exatamente* igual à que aparece no Supabase (Authentication → Providers →
Google), incluindo `https://` e sem barra final.

**Link de confirmação de e-mail ou de redefinição de senha abre página em branco**
→ Confirme a Site URL e as Redirect URLs no Supabase (seção acima). Se o
domínio estiver certo e o problema persistir, abra o console do navegador
(F12) na página em branco — qualquer erro ali ajuda a identificar a causa.

**Assistente IA sempre retorna "ainda não configurado" ou "não está disponível neste ambiente"**
→ Em desenvolvimento: confirme que `backend/.env` tem `ANTHROPIC_API_KEY`
preenchida e que o bloco de chamada real foi descomentado em
`backend/src/routes/assistente.js`. Em produção: confirme que `VITE_API_URL`
aponta para o backend publicado (veja a seção de deploy acima).

**"new row violates row-level security policy"**
→ Normalmente significa que o `user_id` não está sendo enviado corretamente
numa inserção. Confirme que está logado e que o `schema.sql` foi executado
por completo no SQL Editor do Supabase.

---

## 🔮 Próximos passos sugeridos

- Login por número de telefone com SMS (exige configurar um provedor como
  Twilio dentro do Supabase Auth)
- Empacotar como app mobile com Capacitor, reaproveitando todo este frontend
- Upload de foto de perfil usando o Supabase Storage
