import { api } from './api';
import { mesAtualIso, formatarMoeda } from '../utils/formatadores';


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
    saldo_disponivel: formatarMoeda(dashboard.saldo_disponivel),
    total_receitas: formatarMoeda(dashboard.total_receitas),
    total_despesas: formatarMoeda(dashboard.total_despesas),
    percentual_comprometido: `${dashboard.percentual_comprometido}%`,
    gastos_por_categoria: Object.fromEntries(
      Object.entries(dashboard.gastos_por_categoria).map(([categoria, valor]) => [
        categoria,
        formatarMoeda(valor),
      ])
    ),
    contas_pendentes: despesasPendentes.map((d) => ({
      nome: d.nome,
      valor: formatarMoeda(d.valor),
      categoria: d.categoria,
      vencimento: d.data_vencimento,
      prioridade: d.prioridade,
    })),
    metas: metas.map((m) => ({
      nome: m.nome,
      valor_meta: formatarMoeda(m.valor_meta),
      valor_guardado: formatarMoeda(m.valor_guardado),
      progresso: `${m.progresso}%`,
      data_alvo: m.data_alvo,
    })),
    proximo_salario: proximoPlanejamento
      ? {
          valor_previsto: formatarMoeda(proximoPlanejamento.valor_previsto),
          data_prevista: proximoPlanejamento.data_prevista,
          total_ja_planejado: formatarMoeda(proximoPlanejamento.total_planejado),
          restante_estimado: formatarMoeda(proximoPlanejamento.restante),
        }
      : null,
    perfil_comportamental: perfil?.perfil_comportamental || 'equilibrado',
    meta_economia_mensal: formatarMoeda(perfil?.meta_economia_mensal || 0),
  };
}