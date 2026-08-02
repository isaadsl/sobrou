import { Router } from 'express';
import { exigirUsuario } from '../middleware/auth.js';
import supabaseAdmin from '../services/supabaseAdmin.js';
import { criarConnectToken, buscarItem, buscarContas, buscarTransacoes } from '../services/pluggyClient.js';
import { salvarTransacoes } from '../services/transacoesService.js';

const router = Router();

router.post('/connect-token', exigirUsuario, async (req, res) => {
  try {
    const accessToken = await criarConnectToken();
    res.json({ accessToken });
  } catch (erro) {
    console.error('Erro ao gerar connect token:', erro);
    res.status(500).json({ erro: 'Não foi possível iniciar a conexão com o banco.' });
  }
});

router.post('/conectar', exigirUsuario, async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ erro: 'itemId é obrigatório.' });

  try {
    const item = await buscarItem(itemId);
    const contas = await buscarContas(itemId);
    const saldoTotal = contas.reduce((soma, c) => soma + Number(c.balance || 0), 0);

    const { data: contaSalva, error } = await supabaseAdmin
      .from('contas_bancarias')
      .upsert(
        {
          user_id: req.userId,
          pluggy_item_id: itemId,
          instituicao: item.connector?.name || 'Banco conectado',
          saldo: saldoTotal,
          ultima_sincronizacao: new Date().toISOString(),
        },
        { onConflict: 'user_id,pluggy_item_id' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);

    const todasTransacoes = [];
    for (const conta of contas) {
      const transacoes = await buscarTransacoes(conta.id);
      todasTransacoes.push(
        ...transacoes.map((t) => ({
          data: t.date?.slice(0, 10),
          descricao: t.description,
          valor: t.amount,
          externalId: t.id,
        }))
      );
    }

    const resultado = await salvarTransacoes(req.userId, todasTransacoes, {
      origem: 'pluggy',
      contaBancariaId: contaSalva.id,
    });

    res.json({ conta: contaSalva, ...resultado });
  } catch (erro) {
    console.error('Erro ao conectar conta Pluggy:', erro);
    res.status(500).json({ erro: 'Falha ao conectar ou sincronizar a conta bancária.' });
  }
});

router.post('/sincronizar/:contaId', exigirUsuario, async (req, res) => {
  const { contaId } = req.params;
  try {
    const { data: conta, error: erroConta } = await supabaseAdmin
      .from('contas_bancarias')
      .select('*')
      .eq('id', contaId)
      .eq('user_id', req.userId)
      .single();
    if (erroConta || !conta) return res.status(404).json({ erro: 'Conta bancária não encontrada.' });

    const contas = await buscarContas(conta.pluggy_item_id);
    const saldoTotal = contas.reduce((soma, c) => soma + Number(c.balance || 0), 0);

    const desde = conta.ultima_sincronizacao?.slice(0, 10);
    const todasTransacoes = [];
    for (const c of contas) {
      const transacoes = await buscarTransacoes(c.id, { desde });
      todasTransacoes.push(
        ...transacoes.map((t) => ({
          data: t.date?.slice(0, 10),
          descricao: t.description,
          valor: t.amount,
          externalId: t.id,
        }))
      );
    }

    const resultado = await salvarTransacoes(req.userId, todasTransacoes, {
      origem: 'pluggy',
      contaBancariaId: conta.id,
    });

    await supabaseAdmin
      .from('contas_bancarias')
      .update({ saldo: saldoTotal, ultima_sincronizacao: new Date().toISOString() })
      .eq('id', contaId);

    res.json(resultado);
  } catch (erro) {
    console.error('Erro ao sincronizar conta:', erro);
    res.status(500).json({ erro: 'Falha ao sincronizar a conta bancária.' });
  }
});

router.get('/contas', exigirUsuario, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contas_bancarias')
    .select('*')
    .eq('user_id', req.userId)
    .order('criado_em', { ascending: false });
  if (error) return res.status(500).json({ erro: 'Falha ao buscar contas bancárias.' });
  res.json(data || []);
});

router.delete('/contas/:contaId', exigirUsuario, async (req, res) => {
  const { contaId } = req.params;
  try {
    const { data: conta, error: erroConta } = await supabaseAdmin
      .from('contas_bancarias')
      .select('id')
      .eq('id', contaId)
      .eq('user_id', req.userId)
      .single();
    if (erroConta || !conta) return res.status(404).json({ erro: 'Conta bancária não encontrada.' });

    const { error } = await supabaseAdmin
      .from('contas_bancarias')
      .delete()
      .eq('id', contaId)
      .eq('user_id', req.userId);
    if (error) throw new Error(error.message);

    res.json({ sucesso: true });
  } catch (erro) {
    console.error('Erro ao remover conta bancária:', erro);
    res.status(500).json({ erro: 'Falha ao remover a conta bancária.' });
  }
});

export default router;