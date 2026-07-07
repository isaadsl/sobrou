import { supabase } from './supabaseClient';

function checarErro(error) {
  if (error) throw new Error(error.message || 'Erro ao comunicar com o banco de dados');
}

async function usuarioAtualId() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error('Usuário não autenticado');
  return data.user.id;
}

function inicioFimMes(mesIso) {
  const [ano, mes] = mesIso.split('-').map(Number);
  const inicio = `${mesIso}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fim = `${mesIso}-${String(ultimoDia).padStart(2, '0')}`;
  return { inicio, fim };
}

const PRIORIDADE_ORDEM = { alta: 0, media: 1, baixa: 2 };
function ordenarPorPrioridade(lista) {
  return [...lista].sort((a, b) => (PRIORIDADE_ORDEM[a.prioridade] ?? 3) - (PRIORIDADE_ORDEM[b.prioridade] ?? 3));
}


function normalizarNumeros(registro, campos) {
  const copia = { ...registro };
  campos.forEach((campo) => {
    if (copia[campo] !== null && copia[campo] !== undefined) {
      copia[campo] = Number(copia[campo]);
    }
  });
  return copia;
}

function comProgresso(meta) {
  const normalizada = normalizarNumeros(meta, ['valor_meta', 'valor_guardado']);
  const progresso =
    normalizada.valor_meta > 0
      ? Math.min(100, Math.round((normalizada.valor_guardado / normalizada.valor_meta) * 100))
      : 0;
  return { ...normalizada, progresso };
}

export const api = {
  async buscarUsuario() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    checarErro(error);
    return data;
  },

  async buscarDashboard(mes) {
    const userId = await usuarioAtualId();
    const { inicio, fim } = inicioFimMes(mes);

    const [{ data: receitas, error: erroR }, { data: despesas, error: erroD }, perfilUsuario] = await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim),
      supabase.from('despesas').select('*').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim),
      api.buscarUsuario(),
    ]);
    checarErro(erroR);
    checarErro(erroD);

    const receitasPrincipal = receitas.filter((r) => (r.destino || 'principal') === "principal");
    const receitasVale = receitas.filter((r) => r.destino === "vale_refeicao");
    const despesasPrincipal = despesas.filter((d) => (d.destino || 'principal') === "principal");
    const despesasVale = despesas.filter((d) => d.destino === "vale_refeicao");

    
    const totalReceitas = receitasPrincipal.reduce((soma, r) => soma + Number(r.valor), 0);
    const totalDespesas = despesasPrincipal.reduce((soma, d) => soma + Number(d.valor), 0);
    const despesasPagas = despesasPrincipal.filter((d) => d.status === 'paga').reduce((soma, d) => soma + Number(d.valor), 0);
    const despesasPendentes = totalDespesas - despesasPagas;
    const saldoDisponivel = totalReceitas - totalDespesas;
    const percentualComprometido = totalReceitas > 0 ? Math.round((totalDespesas / totalReceitas) * 100) : 0;
    const metaEconomia = perfilUsuario?.meta_economia_mensal || 0;
    const economizado = Math.max(0, totalReceitas - totalDespesas - metaEconomia);

    const porCategoria = {};
    despesasPrincipal.forEach((d) => {
      porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor);
    });

    const totalReceitasVale = receitasVale.reduce((s, r) => s + Number(r.valor), 0);
    const totalDespesasVale = despesasVale.reduce((s, d) => s + Number(d.valor), 0);
    const saldoVale = totalReceitasVale - totalDespesasVale;
    const percentualVale = totalReceitasVale > 0 
      ? Math.round((totalDespesasVale / totalReceitasVale) * 100) 
      : 0;

    return {
      mes,
      saldo_disponivel: saldoDisponivel,
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      despesas_pagas: despesasPagas,
      despesas_pendentes: despesasPendentes,
      percentual_comprometido: percentualComprometido,
      economizado,
      gastos_por_categoria: porCategoria,
      despesas_por_prioridade: ordenarPorPrioridade(despesas),
      receitas,
      despesas,

      saldo_vale_refeicao: saldoVale,
      total_receitas_vale_refeicao: totalReceitasVale,
      total_despesas_vale_refeicao: totalDespesasVale,
      percentual_comprometido_vale_refeicao: percentualVale,
    };
  },  

  async buscarCalendario(mes) {
    const userId = await usuarioAtualId();
    const { inicio, fim } = inicioFimMes(mes);
    const hoje = new Date();

    const [{ data: receitas, error: erroR }, { data: despesas, error: erroD }] = await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim),
      supabase.from('despesas').select('*').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim),
    ]);
    checarErro(erroR);
    checarErro(erroD);

    const eventos = [];

    receitas.forEach((r) => {
      eventos.push({ data: r.data_recebimento, tipo: 'recebimento', icone: '💰', descricao: r.nome, valor: r.valor });
    });

    despesas.forEach((d) => {
      const vencimento = new Date(d.data_vencimento);
      const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
      let tipo = 'vencimento';
      let icone = '🧾';

      if (d.status === 'paga') {
        tipo = 'paga';
        icone = '✅';
      } else if (diffDias >= 0 && diffDias <= 5) {
        tipo = 'proxima_vencimento';
        icone = '⚠️';
      }

      eventos.push({ data: d.data_vencimento, tipo, icone, descricao: d.nome, valor: d.valor, prioridade: d.prioridade });
    });

    return eventos;
  },  

  async buscarRelatorios(meses = 6) {
    const userId = await usuarioAtualId();
    const hoje = new Date();
    const resultado = [];

    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesIso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const { inicio, fim } = inicioFimMes(mesIso);

      const [{ data: receitas, error: erroR }, { data: despesas, error: erroD }] = await Promise.all([
        supabase.from('receitas').select('valor').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim),
        supabase.from('despesas').select('valor').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim),
      ]);
      checarErro(erroR);
      checarErro(erroD);

      const totalReceitas = (receitas || []).reduce((soma, r) => soma + Number(r.valor || 0), 0);
      const totalDespesas = (despesas || []).reduce((soma, d) => soma + Number(d.valor || 0), 0);

      resultado.push({
        mes: mesIso,
        receitas: totalReceitas,
        despesas: totalDespesas,
        economia: totalReceitas - totalDespesas,
      });
    }

    return resultado;
  },  

  async salvarConversaIA({ pergunta, resposta, contexto_usado }) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('conversas_ia')
      .insert({ pergunta, resposta, contexto_usado, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

 
  async listarReceitas() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .eq('user_id', userId)
      .order('data_recebimento', { ascending: false });
    checarErro(error);
    return (data || []).map((r) => normalizarNumeros(r, ['valor']));
  },

  async criarReceita(receita) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('receitas')
      .insert({ ...receita, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async excluirReceita(id) {
    const userId = await usuarioAtualId();
    const { error } = await supabase.from('receitas').delete().eq('id', id).eq('user_id', userId);
    checarErro(error);
  },

  
  async listarDespesas(params = {}) {
    const userId = await usuarioAtualId();
    let query = supabase.from('despesas').select('*').eq('user_id', userId);
    if (params.status) query = query.eq('status', params.status);
    if (params.categoria) query = query.eq('categoria', params.categoria);
    const { data, error } = await query.order('data_vencimento', { ascending: true });
    checarErro(error);
    return (data || []).map((d) => normalizarNumeros(d, ['valor']));
  },

  async criarDespesa(despesa) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('despesas')
      .insert({ ...despesa, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async alternarStatusDespesa(id) {
    const userId = await usuarioAtualId();
    const { data: despesa, error: erroBusca } = await supabase
      .from('despesas')
      .select('status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    checarErro(erroBusca);

    const novoStatus = despesa.status === 'paga' ? 'pendente' : 'paga';
    const { error } = await supabase
      .from('despesas')
      .update({ status: novoStatus })
      .eq('id', id)
      .eq('user_id', userId);
    checarErro(error);
  },

  async excluirDespesa(id) {
    const userId = await usuarioAtualId();
    const { error } = await supabase.from('despesas').delete().eq('id', id).eq('user_id', userId);
    checarErro(error);
  },

  
  async listarPlanejamentos() {
    const userId = await usuarioAtualId();
    const { data: planejamentos, error } = await supabase
      .from('planejamento_proximo_salario')
      .select('*')
      .eq('user_id', userId)
      .order('data_prevista', { ascending: true });
    checarErro(error);

    const resultado = await Promise.all(
      (planejamentos || []).map(async (planejamento) => {
        const { data: itens, error: erroItens } = await supabase
          .from('planejamento_itens')
          .select('*')
          .eq('planejamento_id', planejamento.id);
        checarErro(erroItens);
        return montarResumoPlanejamento(planejamento, itens || []);
      })
    );
    return resultado;
  },

  async criarPlanejamento(planejamento) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('planejamento_proximo_salario')
      .insert({ ...planejamento, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async adicionarItemPlanejamento(planejamentoId, item) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('planejamento_itens')
      .insert({ ...item, planejamento_id: planejamentoId, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async removerItemPlanejamento(planejamentoId, itemId) {
    const { error } = await supabase
      .from('planejamento_itens')
      .delete()
      .eq('id', itemId)
      .eq('planejamento_id', planejamentoId);
    checarErro(error);
  },

  async excluirPlanejamento(id) {
    const userId = await usuarioAtualId();
    await supabase.from('planejamento_itens').delete().eq('planejamento_id', id);
    const { error } = await supabase
      .from('planejamento_proximo_salario')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    checarErro(error);
  },

  
  async buscarPlanejamentoMensal(mes) {
    const userId = await usuarioAtualId();
    const { inicio, fim } = inicioFimMes(mes);
    const hoje = new Date().toISOString().slice(0, 10);

    const [
      { data: receitas, error: erroR },
      { data: despesas, error: erroD },
      { data: planejamentosSalario, error: erroP },
    ] = await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim),
      supabase.from('despesas').select('*').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim),
      supabase.from('planejamento_proximo_salario').select('*').eq('user_id', userId).gte('data_prevista', inicio).lte('data_prevista', fim),
    ]);
    checarErro(erroR);
    checarErro(erroD);
    checarErro(erroP);

    const totalReceitas = (receitas || []).reduce((s, r) => s + Number(r.valor), 0);
    const totalDespesas = (despesas || []).reduce((s, d) => s + Number(d.valor), 0);
    const saldoProjetado = totalReceitas - totalDespesas;

    const recebimentosDeReceitas = (receitas || [])
      .filter((r) => r.data_recebimento >= hoje)
      .map((r) => ({
        id: `receita-${r.id}`,
        nome: r.nome,
        data_recebimento: r.data_recebimento,
        valor: Number(r.valor),
      }));

    const recebimentosDePlanejamentos = (planejamentosSalario || [])
      .filter((p) => p.data_prevista >= hoje)
      .map((p) => ({
        id: `planejamento-${p.id}`,
        nome: p.observacoes?.trim() || 'Próximo salário',
        data_recebimento: p.data_prevista,
        valor: Number(p.valor_previsto),
      }));

    const recebimentosFuturos = [...recebimentosDeReceitas, ...recebimentosDePlanejamentos].sort(
      (a, b) => a.data_recebimento.localeCompare(b.data_recebimento)
    );

    const contasFuturas = (despesas || []).filter((d) => d.status !== 'paga' && d.data_vencimento >= hoje);
    const gastosRealizados = (despesas || []).filter((d) => d.status === 'paga');

    return {
      mes,
      saldo_projetado: saldoProjetado,
      recebimentos_futuros: recebimentosFuturos,
      contas_futuras: contasFuturas,
      gastos_realizados: gastosRealizados,
    };
  },

  
  async listarMetas() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('user_id', userId)
      .order('data_alvo', { ascending: true });
    checarErro(error);
    return (data || []).map((meta) => comProgresso(meta));
  },

  async criarMeta(meta) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('metas')
      .insert({ ...meta, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async atualizarMeta(id, patch) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('metas')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    checarErro(error);
    return data;
  },

  async excluirMeta(id) {
    const userId = await usuarioAtualId();
    const { error } = await supabase.from('metas').delete().eq('id', id).eq('user_id', userId);
    checarErro(error);
  },
};

function montarResumoPlanejamento(planejamentoOriginal, itensOriginais) {
  const planejamento = normalizarNumeros(planejamentoOriginal, ['valor_previsto']);
  const itens = itensOriginais.map((item) => normalizarNumeros(item, ['valor']));

  const totalPlanejado = itens.reduce((soma, item) => soma + item.valor, 0);
  const restante = planejamento.valor_previsto - totalPlanejado;
  const percentualComprometido =
    planejamento.valor_previsto > 0 ? Math.round((totalPlanejado / planejamento.valor_previsto) * 100) : 0;

  return {
    ...planejamento,
    itens,
    total_planejado: totalPlanejado,
    restante,
    percentual_comprometido: percentualComprometido,
  };
}