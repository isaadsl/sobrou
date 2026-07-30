import fetch from 'node-fetch';

const PLUGGY_BASE_URL = 'https://api.pluggy.ai';
let apiKeyCache = { valor: null, expiraEm: 0 };

async function obterApiKey() {
  if (apiKeyCache.valor && Date.now() < apiKeyCache.expiraEm) {
    return apiKeyCache.valor;
  }
  const resposta = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  });
  if (!resposta.ok) throw new Error('Falha ao autenticar com a Pluggy');
  const dados = await resposta.json();
  apiKeyCache = { valor: dados.apiKey, expiraEm: Date.now() + 1000 * 60 * 50 };
  return dados.apiKey;
}

async function pluggyFetch(caminho, opcoes = {}) {
  const apiKey = await obterApiKey();
  const resposta = await fetch(`${PLUGGY_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...(opcoes.headers || {}),
    },
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Pluggy respondeu com erro: ${resposta.status} ${texto}`);
  }
  return resposta.json();
}

export async function criarConnectToken(itemId) {
  const body = itemId ? { itemId } : {};
  const dados = await pluggyFetch('/connect_token', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return dados.accessToken;
}

export async function buscarItem(itemId) {
  return pluggyFetch(`/items/${itemId}`);
}

export async function buscarContas(itemId) {
  const dados = await pluggyFetch(`/accounts?itemId=${itemId}`);
  return dados.results || [];
}

export async function buscarTransacoes(accountId, { desde } = {}) {
  const params = new URLSearchParams({ accountId });
  if (desde) params.set('createdAtFrom', desde);

  let dados = await pluggyFetch(`/v2/transactions?${params.toString()}`);
  let todasTransacoes = dados.results || [];

  while (dados.next) {
    const apiKey = await obterApiKey();
    const urlProximaPagina = dados.next.startsWith('http')
      ? dados.next
      : `${PLUGGY_BASE_URL}/v2/transactions${dados.next}`;

    const resposta = await fetch(urlProximaPagina, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });
    if (!resposta.ok) {
      const texto = await resposta.text();
      throw new Error(`Pluggy respondeu com erro: ${resposta.status} ${texto}`);
    }
    dados = await resposta.json();
    todasTransacoes = todasTransacoes.concat(dados.results || []);
  }

  return todasTransacoes;
}