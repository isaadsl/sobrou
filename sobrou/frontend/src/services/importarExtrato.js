import { supabase } from './supabaseClient';

const URL_BASE_API = import.meta.env.VITE_API_URL || '';

async function tokenAutenticacao() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

export async function importarArquivoExtrato(arquivo) {
  const token = await tokenAutenticacao();
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const resposta = await fetch(`${URL_BASE_API}/api/importar/extrato`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro ao importar o arquivo.');
  }
  return dados;
}