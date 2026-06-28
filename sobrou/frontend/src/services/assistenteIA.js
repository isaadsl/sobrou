import { montarContextoFinanceiro } from './contextoFinanceiro';
import { api } from './api';

// Em desenvolvimento, '/api/assistente' funciona através do proxy do Vite
// (vite.config.js) para o backend local. Em produção esse proxy não existe
// — o site é estático (GitHub Pages) e o backend precisa estar publicado
// em algum serviço próprio. VITE_API_URL aponta para essa URL pública;
// sem ela configurada, avisamos isso claramente em vez de deixar a chamada
// falhar tentando interpretar uma página de erro HTML como JSON.
const URL_BASE_API = import.meta.env.VITE_API_URL || '';
const URL_ASSISTENTE = `${URL_BASE_API}/api/assistente`;

export async function perguntarAoAssistente(pergunta, historico = []) {
  if (!URL_BASE_API && import.meta.env.PROD) {
    throw new Error(
      'O Assistente Financeiro ainda não está disponível neste ambiente: defina VITE_API_URL com o endereço do backend publicado.'
    );
  }

  const [contexto, perfilUsuario] = await Promise.all([
    montarContextoFinanceiro(),
    api.buscarUsuario(),
  ]);

  const resposta = await fetch(`${URL_ASSISTENTE}/perguntar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pergunta,
      contexto,
      perfilComportamental: perfilUsuario?.perfil_comportamental || 'equilibrado',
      historico: historico.slice(-6),
    }),
  });

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
 * Monta uma pergunta formatada para o modo "Simular Compra" e delega
 * para o fluxo normal do assistente.
 */
export async function simularCompra(descricaoItem, valor) {
  const pergunta = `Quero simular uma compra: "${descricaoItem}" no valor de R$ ${Number(valor).toFixed(2)}. Mostre meu saldo atual, o impacto dessa compra, quais contas pendentes ainda preciso pagar, e quanto sobraria até o próximo salário.`;
  return perguntarAoAssistente(pergunta);
}
