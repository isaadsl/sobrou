import { api } from './api';
import { mesAtualIso } from '../utils/formatadores';

/**
 * Monta um resumo compacto e completo da situação financeira do usuário,
 * usado como contexto para o Assistente Financeiro IA responder de forma
 * personalizada.
 */
export async function montarContextoFinanceiro() {
  const mes = mesAtualIso();

  const [dashboard, metas, planejamentos, perfil] = await Promise.all([
    api.buscarDashboard(mes),
    api.listarMetas(),
    api.listarPlanejamentos(),
    api.buscarUsuario(),
  ]);

  const despesasPendentes = dashboard.despesas.filter((d) => d.status !== 'paga');
  const proximoPlanejamento = planejamentos[0] || null;

  return {
    mes_atual: mes,
    saldo_disponivel: dashboard.saldo_disponivel,
    total_receitas: dashboard.total_receitas,
    total_despesas: dashboard.total_despesas,
    percentual_comprometido: dashboard.percentual_comprometido,
    gastos_por_categoria: dashboard.gastos_por_categoria,
    contas_pendentes: despesasPendentes.map((d) => ({
      nome: d.nome,
      valor: d.valor,
      categoria: d.categoria,
      vencimento: d.data_vencimento,
      prioridade: d.prioridade,
    })),
    metas: metas.map((m) => ({
      nome: m.nome,
      valor_meta: m.valor_meta,
      valor_guardado: m.valor_guardado,
      progresso: m.progresso,
      data_alvo: m.data_alvo,
    })),
    proximo_salario: proximoPlanejamento
      ? {
          valor_previsto: proximoPlanejamento.valor_previsto,
          data_prevista: proximoPlanejamento.data_prevista,
          total_ja_planejado: proximoPlanejamento.total_planejado,
          restante_estimado: proximoPlanejamento.restante,
        }
      : null,
    perfil_comportamental: perfil?.perfil_comportamental || 'equilibrado',
    meta_economia_mensal: perfil?.meta_economia_mensal || 0,
  };
}
