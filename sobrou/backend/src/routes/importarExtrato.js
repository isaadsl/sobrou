import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { exigirUsuario } from '../middleware/auth.js';
import { parsearOfx } from '../services/parsers/ofx.js';
import { salvarTransacoes } from '../services/transacoesService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function parsearPlanilha(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const primeiraAba = workbook.SheetNames[0];
  const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba], { defval: '' });

  const transacoes = [];

  for (const linha of linhas) {
    // Tenta reconhecer colunas comuns em extratos exportados (data, descrição, valor)
    const chaves = Object.keys(linha).reduce((acc, chave) => {
      acc[chave.toLowerCase().trim()] = linha[chave];
      return acc;
    }, {});

    const dataBruta =
      chaves['data'] ?? chaves['data lançamento'] ?? chaves['date'] ?? chaves['dt'];
    const descricao =
      chaves['descricao'] ?? chaves['descrição'] ?? chaves['histórico'] ?? chaves['historico'] ?? chaves['description'] ?? '';
    const valorBruto =
      chaves['valor'] ?? chaves['amount'] ?? chaves['valor (r$)'];

    if (dataBruta === undefined || valorBruto === undefined) continue;

    let data;
    if (dataBruta instanceof Date) {
      data = dataBruta.toISOString().slice(0, 10);
    } else {
      const texto = String(dataBruta).trim();
      // aceita DD/MM/AAAA ou AAAA-MM-DD
      if (texto.includes('/')) {
        const [dia, mes, ano] = texto.split('/');
        data = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else {
        data = texto.slice(0, 10);
      }
    }

    const valor = Number(String(valorBruto).replace(/\./g, '').replace(',', '.')) || Number(valorBruto);
    if (!data || Number.isNaN(valor)) continue;

    transacoes.push({
      data,
      descricao: String(descricao || 'Transação importada'),
      valor,
      externalId: `${data}-${valor}-${descricao}`,
    });
  }

  return transacoes;
}

router.post('/extrato', exigirUsuario, upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

  try {
    const nomeArquivo = req.file.originalname.toLowerCase();
    let transacoes = [];

    if (nomeArquivo.endsWith('.ofx')) {
      const conteudo = req.file.buffer.toString('utf-8');
      transacoes = parsearOfx(conteudo);
    } else if (nomeArquivo.endsWith('.csv') || nomeArquivo.endsWith('.xlsx')) {
      transacoes = parsearPlanilha(req.file.buffer);
    } else {
      return res.status(400).json({ erro: 'Formato de arquivo não suportado. Use .ofx, .csv ou .xlsx.' });
    }

    if (transacoes.length === 0) {
      return res.status(400).json({ erro: 'Não foi possível encontrar transações no arquivo enviado.' });
    }

    const resultado = await salvarTransacoes(req.userId, transacoes, {
      origem: 'importacao',
      contaBancariaId: null,
    });

    res.json(resultado);
  } catch (erro) {
    console.error('Erro ao importar extrato:', erro);
    res.status(500).json({ erro: 'Falha ao processar o arquivo enviado.' });
  }
});

export default router;