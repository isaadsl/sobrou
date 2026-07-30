import supabaseAdmin from './supabaseAdmin.js';

/**
 * Converte uma lista de transações genéricas ({ data, descricao, valor, externalId })
 * no modelo já usado pelo app (receitas para valores >= 0, despesas para valores < 0)
 * e grava no Supabase, ignorando duplicados via (user_id, origem, external_id).
 */
export async function salvarTransacoes(userId, transacoes, { origem, contaBancariaId } = {}) {
  const receitas = [];
  const despesas = [];

  for (const t of transacoes) {
    const valor = Number(t.valor);
    if (!t.data || Number.isNaN(valor)) continue;

    const base = {
      user_id: userId,
      nome: t.descricao || 'Transação importada',
      valor: Math.abs(valor),
      origem,
      external_id: t.externalId,
      conta_bancaria_id: contaBancariaId || null,
    };

    if (valor >= 0) {
      receitas.push({ ...base, data_recebimento: t.data, tipo: 'Importado', recebido: true });
    } else {
      despesas.push({ ...base, data_vencimento: t.data, categoria: 'Outros', status: 'paga' });
    }
  }

  const resultado = { receitas_importadas: 0, despesas_importadas: 0, duplicadas: 0 };

  if (receitas.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('receitas')
      .upsert(receitas, { onConflict: 'user_id,origem,external_id', ignoreDuplicates: true })
      .select();
    if (error) throw new Error(error.message);
    resultado.receitas_importadas = data?.length || 0;
  }

  if (despesas.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('despesas')
      .upsert(despesas, { onConflict: 'user_id,origem,external_id', ignoreDuplicates: true })
      .select();
    if (error) throw new Error(error.message);
    resultado.despesas_importadas = data?.length || 0;
  }

  resultado.duplicadas = transacoes.length - resultado.receitas_importadas - resultado.despesas_importadas;
  return resultado;
}