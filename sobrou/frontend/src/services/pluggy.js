import { supabase } from './supabaseClient';

const URL_BASE_API = import.meta.env.VITE_API_URL || '';
const URL_PLUGGY = `${URL_BASE_API}/api/pluggy`;

async function tokenAutenticacao() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

async function chamarApi(caminho, opcoes = {}) {
  const token = await tokenAutenticacao();
  const resposta = await fetch(`${URL_PLUGGY}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opcoes.headers || {}),
    },
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro ao comunicar com o servidor.');
  }
  return dados;
}

export async function obterConnectToken() {
  const dados = await chamarApi('/connect-token', { method: 'POST' });
  return dados.accessToken;
}

export async function conectarConta(itemId) {
  return chamarApi('/conectar', { method: 'POST', body: JSON.stringify({ itemId }) });
}

export async function sincronizarConta(contaId) {
  return chamarApi(`/sincronizar/${contaId}`, { method: 'POST' });
}

export async function listarContasBancarias() {
  return chamarApi('/contas');
}

export async function removerContaBancaria(contaId) {
  return chamarApi(`/contas/${contaId}`, { method: 'DELETE' });
}