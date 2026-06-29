import { montarContextoFinanceiro } from './contextoFinanceiro';
import { api } from './api';

// Em desenvolvimento, '/api/assistente' funciona através do proxy do Vite.
// Em produção, o site é estático (GitHub Pages) e o backend precisa estar publicado.
// VITE_API_URL deve apontar para essa URL pública.
const URL_BASE_API = import.meta.env.VITE_API_URL || '';
const URL_ASSISTENTE = `${URL_BASE_API}/api/assistente`;

export async function perguntarAoAssistente(pergunta, historico = []) {
  // Se estiver em produção e não houver VITE_API_URL configurada, avisa o usuário
  if (!URL_BASE_API && import.meta.env.PROD) {
    throw new Error(
      'O Assistente Financeiro não está disponível neste ambiente: defina VITE_API_URL com o endereço do backend publicado.'
    );
  }

  // Monta contexto e busca perfil do usuário
  const [contexto, perfilUsuario] = await Promise.all([
    montarContextoFinanceiro(),
    api.buscarUsuario(),
  ]);

  // Faz a chamada ao backend
  const resposta = await fetch(`${URL_ASSISTENTE}/perguntar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pergunta,
      contexto,
      perfilComportamental: perfilUsuario?.perfil_comportamental || 'equilibrado',
      historico: historico.slice(-6), // envia até 6 mensagens anteriores
    }),
  });

  // Verifica se a resposta é JSON
  const tipoConteudo = resposta.headers.get('content-type') || '';
  if (!tipoConteudo.includes('application/json')) {
    throw new Error('O Assistente Financeiro não respondeu corretamente. Tente novamente em alguns instantes.');
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível obter resposta do assistente.');
  }

  return dados.resposta;
}

/**
 * Monta uma pergunta formatada para o modo "Simular Compra"
 * e delega para o fluxo normal do assistente.
 */
export async function simularCompra(descricaoItem, valor) {
  const pergunta = `Quero simular uma compra: "${descricaoItem}" no valor de R$ ${Number(valor).toFixed(2)}. Mostre meu saldo atual, o impacto dessa compra, quais contas pendentes ainda preciso pagar, e quanto sobraria até o próximo salário.`;
  return perguntarAoAssistente(pergunta);
}
