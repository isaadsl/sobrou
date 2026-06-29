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

// O Postgres/PostgREST pode retornar colunas `numeric` como string para
// preservar precisão. Convertendo explicitamente para Number aqui evita
// bugs sutis de concatenação de string em vez de soma matemática.
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
  // ---------------- Usuário / Perfil ----------------
  async buscarUsuario() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    checarErro(error);
    return data;
  },

  async atualizarUsuario(dados) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('profiles')
      .update(dados)
      .eq('id', userId)
      .select()
      .single();
    checarErro(error);
    return data;
  },

  // ---------------- Receitas ----------------
  async listarReceitas(mes) {
    const userId = await usuarioAtualId();
    let query = supabase.from('receitas').select('*').eq('user_id', userId).order('data_recebimento');

    if (mes) {
      const { inicio, fim } = inicioFimMes(mes);
      query = query.gte('data_recebimento', inicio).lte('data_recebimento', fim);
    }

    const { data, error } = await query;
    checarErro(error);
    return data.map((r) => normalizarNumeros(r, ['valor']));
  },

  async criarReceita(dados) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('receitas')
      .insert({ ...dados, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return normalizarNumeros(data, ['valor']);
  },

  async atualizarReceita(id, dados) {
    const { data, error } = await supabase.from('receitas').update(dados).eq('id', id).select().single();
    checarErro(error);
    return normalizarNumeros(data, ['valor']);
  },

  async excluirReceita(id) {
    const { error } = await supabase.from('receitas').delete().eq('id', id);
    checarErro(error);
    return null;
  },

  // ---------------- Despesas ----------------
  async listarDespesas(params = {}) {
    const userId = await usuarioAtualId();
    let query = supabase.from('despesas').select('*').eq('user_id', userId);

    if (params.mes) {
      const { inicio, fim } = inicioFimMes(params.mes);
      query = query.gte('data_vencimento', inicio).lte('data_vencimento', fim);
    }
    if (params.status) query = query.eq('status', params.status);
    if (params.categoria) query = query.eq('categoria', params.categoria);

    const { data, error } = await query;
    checarErro(error);
    return ordenarPorPrioridade(data.map((d) => normalizarNumeros(d, ['valor'])));
  },

  async criarDespesa(dados) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('despesas')
      .insert({ ...dados, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return normalizarNumeros(data, ['valor']);
  },

  async atualizarDespesa(id, dados) {
    const { data, error } = await supabase.from('despesas').update(dados).eq('id', id).select().single();
    checarErro(error);
    return normalizarNumeros(data, ['valor']);
  },

  async alternarStatusDespesa(id) {
    const { data: atual, error: erroBusca } = await supabase
      .from('despesas')
      .select('status')
      .eq('id', id)
      .single();
    checarErro(erroBusca);

    const novoStatus = atual.status === 'paga' ? 'pendente' : 'paga';
    const { data, error } = await supabase
      .from('despesas')
      .update({ status: novoStatus })
      .eq('id', id)
      .select()
      .single();
    checarErro(error);
    return normalizarNumeros(data, ['valor']);
  },

  async excluirDespesa(id) {
    const { error } = await supabase.from('despesas').delete().eq('id', id);
    checarErro(error);
    return null;
  },

  // ---------------- Metas ----------------
  async listarMetas() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false });
    checarErro(error);

    return data.map(comProgresso);
  },

  async criarMeta(dados) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('metas')
      .insert({ ...dados, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return comProgresso(data);
  },

  async atualizarMeta(id, dados) {
    const { data, error } = await supabase.from('metas').update(dados).eq('id', id).select().single();
    checarErro(error);
    return comProgresso(data);
  },

  async excluirMeta(id) {
    const { error } = await supabase.from('metas').delete().eq('id', id);
    checarErro(error);
    return null;
  },

  // ---------------- Planejamento do Próximo Salário ----------------
  async listarPlanejamentos() {
    const userId = await usuarioAtualId();
    const { data: planejamentos, error } = await supabase
      .from('planejamento_proximo_salario')
      .select('*')
      .eq('user_id', userId)
      .order('data_prevista');
    checarErro(error);

    const resultados = await Promise.all(
      planejamentos.map(async (p) => {
        const { data: itens, error: erroItens } = await supabase
          .from('planejamento_itens')
          .select('*')
          .eq('planejamento_id', p.id)
          .order('valor', { ascending: false });
        checarErro(erroItens);
        return montarResumoPlanejamento(p, itens);
      })
    );

    return resultados;
  },

  async buscarPlanejamento(id) {
    const { data: p, error } = await supabase
      .from('planejamento_proximo_salario')
      .select('*')
      .eq('id', id)
      .single();
    checarErro(error);

    const { data: itens, error: erroItens } = await supabase
      .from('planejamento_itens')
      .select('*')
      .eq('planejamento_id', id)
      .order('valor', { ascending: false });
    checarErro(erroItens);

    return montarResumoPlanejamento(p, itens);
  },

  async criarPlanejamento(dados) {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('planejamento_proximo_salario')
      .insert({ ...dados, user_id: userId })
      .select()
      .single();
    checarErro(error);
    return montarResumoPlanejamento(data, []);
  },

  async excluirPlanejamento(id) {
    const { error } = await supabase.from('planejamento_proximo_salario').delete().eq('id', id);
    checarErro(error);
    return null;
  },

  async adicionarItemPlanejamento(planejamentoId, dados) {
    const userId = await usuarioAtualId();
    const { error: erroInsert } = await supabase
      .from('planejamento_itens')
      .insert({ ...dados, planejamento_id: planejamentoId, user_id: userId });
    checarErro(erroInsert);

    return api.buscarPlanejamento(planejamentoId);
  },

  async removerItemPlanejamento(planejamentoId, itemId) {
    const { error } = await supabase.from('planejamento_itens').delete().eq('id', itemId);
    checarErro(error);
    return api.buscarPlanejamento(planejamentoId);
  },

  // ---------------- Dashboard (calculado no cliente a partir dos dados) ----------------
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

    const totalReceitas = receitas.reduce((soma, r) => soma + Number(r.valor), 0);
    const totalDespesas = despesas.reduce((soma, d) => soma + Number(d.valor), 0);
    const despesasPagas = despesas.filter((d) => d.status === 'paga').reduce((soma, d) => soma + Number(d.valor), 0);
    const despesasPendentes = totalDespesas - despesasPagas;
    const saldoDisponivel = totalReceitas - totalDespesas;
    const percentualComprometido = totalReceitas > 0 ? Math.round((totalDespesas / totalReceitas) * 100) : 0;
    const metaEconomia = perfilUsuario?.meta_economia_mensal || 0;
    const economizado = Math.max(0, totalReceitas - totalDespesas - metaEconomia);

    const porCategoria = {};
    despesas.forEach((d) => {
      porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor);
    });

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

      const [{ data: receitas }, { data: despesas }] = await Promise.all([
        supabase.from('receitas').select('valor').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim),
        supabase.from('despesas').select('valor').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim),
      ]);

      const totalReceitas = (receitas || []).reduce((soma, r) => soma + Number(r.valor), 0);
      const totalDespesas = (despesas || []).reduce((soma, d) => soma + Number(d.valor), 0);

      resultado.push({
        mes: mesIso,
        receitas: totalReceitas,
        despesas: totalDespesas,
        economia: totalReceitas - totalDespesas,
      });
    }

    return resultado;
  },

  async buscarPlanejamentoMensal(mes) {
    const userId = await usuarioAtualId();
    const { inicio, fim } = inicioFimMes(mes);
    const hoje = new Date().toISOString().split('T')[0];

    const [{ data: receitas, error: erroR }, { data: despesas, error: erroD }] = await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', userId).gte('data_recebimento', inicio).lte('data_recebimento', fim).order('data_recebimento'),
      supabase.from('despesas').select('*').eq('user_id', userId).gte('data_vencimento', inicio).lte('data_vencimento', fim).order('data_vencimento'),
    ]);
    checarErro(erroR);
    checarErro(erroD);

    const recebimentosFuturos = receitas.filter((r) => r.data_recebimento >= hoje);
    const contasFuturas = despesas.filter((d) => d.data_vencimento >= hoje && d.status !== 'paga');
    const gastosRealizados = despesas.filter((d) => d.status === 'paga');

    const totalReceitas = receitas.reduce((soma, r) => soma + Number(r.valor), 0);
    const totalDespesas = despesas.reduce((soma, d) => soma + Number(d.valor), 0);

    return {
      mes,
      recebimentos_futuros: recebimentosFuturos,
      contas_futuras: contasFuturas,
      gastos_realizados: gastosRealizados,
      saldo_projetado: totalReceitas - totalDespesas,
    };
  },

  // ---------------- Conversas com a IA ----------------
  async listarConversasIA() {
    const userId = await usuarioAtualId();
    const { data, error } = await supabase
      .from('conversas_ia')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: true });
    checarErro(error);
    return data;
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
