import { montarContextoFinanceiro } from './contextoFinanceiro';
import { api } from './api';


const URL_BASE_API = import.meta.env.VITE_API_URL || '';
const URL_ASSISTENTE = `${URL_BASE_API}/api/assistente`;

export async function perguntarAoAssistente(pergunta, historico = []) {

  if (!URL_BASE_API && import.meta.env.PROD) {
    throw new Error(
      'O Assistente Financeiro não está disponível neste ambiente: defina VITE_API_URL com o endereço do backend publicado.'
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


export async function simularCompra(descricaoItem, valor) {
  const pergunta = `Quero simular uma compra: "${descricaoItem}" no valor de R$ ${Number(valor).toFixed(2)}. Mostre meu saldo atual, o impacto dessa compra, quais contas pendentes ainda preciso pagar, e quanto sobraria até o próximo salário.`;
  return perguntarAoAssistente(pergunta);
}
