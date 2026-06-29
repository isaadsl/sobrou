import { supabase } from './supabaseClient';
import { api } from './api';

const DIAS_MINIMOS_PARA_CALCULAR = 5; // exige uso mínimo antes de classificar

/**
 * Calcula o perfil comportamental do usuário (econômico, equilibrado ou
 * gastador) com base no histórico real de receitas/despesas dos últimos
 * meses. Roda silenciosamente — não bloqueia a interface.
 *
 * Critérios:
 * - Taxa de economia média (quanto sobra em relação ao que entra)
 * - Pontualidade no pagamento de contas (% pago em dia vs. atrasado)
 * - Consistência: gasta mais que recebe em algum mês?
 */
export async function calcularPerfilComportamental(userId) {
  const { data: perfilAtual } = await supabase
    .from('profiles')
    .select('criado_em, perfil_calculado_em')
    .eq('id', userId)
    .single();

  if (!perfilAtual) return null;

  const diasDeConta = diasDesde(perfilAtual.criado_em);
  if (diasDeConta < DIAS_MINIMOS_PARA_CALCULAR) {
    return { elegivel: false, dias_necessarios: DIAS_MINIMOS_PARA_CALCULAR - diasDeConta };
  }

  const relatorios = await api.buscarRelatorios(3); // últimos 3 meses
  const mesesComMovimento = relatorios.filter((m) => m.receitas > 0 || m.despesas > 0);

  if (mesesComMovimento.length === 0) {
    return { elegivel: false, motivo: 'sem_dados' };
  }

  // Taxa média de economia: (receita - despesa) / receita
  const taxasEconomia = mesesComMovimento
    .filter((m) => m.receitas > 0)
    .map((m) => (m.receitas - m.despesas) / m.receitas);

  const taxaMediaEconomia =
    taxasEconomia.length > 0 ? taxasEconomia.reduce((a, b) => a + b, 0) / taxasEconomia.length : 0;

  // Pontualidade: % de despesas pagas vs. total no período
  const despesas = await api.listarDespesas({});
  const totalDespesas = despesas.length;
  const despesasPagas = despesas.filter((d) => d.status === 'paga').length;
  const taxaPontualidade = totalDespesas > 0 ? despesasPagas / totalDespesas : 1;

  let perfil = 'equilibrado';

  if (taxaMediaEconomia >= 0.2 && taxaPontualidade >= 0.7) {
    perfil = 'economico';
  } else if (taxaMediaEconomia < 0 || taxaMediaEconomia < 0.05) {
    perfil = 'gastador';
  } else {
    perfil = 'equilibrado';
  }

  await supabase
    .from('profiles')
    .update({
      perfil_comportamental: perfil,
      perfil_calculado_em: new Date().toISOString(),
    })
    .eq('id', userId);

  return {
    elegivel: true,
    perfil,
    taxa_media_economia: Math.round(taxaMediaEconomia * 100),
    taxa_pontualidade: Math.round(taxaPontualidade * 100),
  };
}

function diasDesde(dataIso) {
  const data = new Date(dataIso);
  const hoje = new Date();
  return Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
}

export const DESCRICOES_PERFIL = {
  economico: {
    rotulo: 'Econômico',
    emoji: '🌱',
    descricao: 'Você costuma guardar uma boa parte do que recebe e mantém as contas em dia.',
  },
  equilibrado: {
    rotulo: 'Equilibrado',
    emoji: '⚖️',
    descricao: 'Seus gastos e receitas estão relativamente balanceados, com espaço para melhorar a economia.',
  },
  gastador: {
    rotulo: 'Gastador',
    emoji: '🔥',
    descricao: 'Seus gastos costumam consumir quase toda (ou mais que) sua renda mensal.',
  },
};
