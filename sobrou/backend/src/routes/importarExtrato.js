import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { exigirUsuario } from '../middleware/auth.js';
import { salvarTransacoes } from '../services/transacoesService.js';
import { parsearOfx } from '../services/parsers/ofx.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function gerarExternalId(data, valor, descricao) {
  return crypto.createHash('sha1').update(`${data}|${valor}|${descricao}`).digest('hex');
}

function parseCsv(buffer) {
  const texto = buffer.toString('utf-8');
  const { data } = Papa.parse(texto, { header: true, skipEmptyLines: true });
  return data
    .map((linha) => {
      const data_ = linha.data || linha.Data || linha.date || linha.Date;
      const descricao = linha.descricao || linha.Descricao || linha.description || linha.Description || 'Transação importada';
      const valor = Number(linha.valor || linha.Valor || linha.amount || linha.Amount || 0);
      return { data: data_, descricao, valor, externalId: gerarExternalId(data_, valor, descricao) };
    })
    .filter((t) => t.data && !Number.isNaN(t.valor));
}

function parseXlsx(buffer) {
  const planilha = XLSX.read(buffer, { type: 'buffer' });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json(primeiraAba, { defval: '' });
  return linhas
    .map((linha) => {
      const dataBruta = linha.data || linha.Data || linha.date || linha.Date;
      const data_ = typeof dataBruta === 'string' ? dataBruta : new Date(dataBruta).toISOString().slice(0, 10);
      const descricao = linha.descricao || linha.Descricao || linha.description || linha.Description || 'Transação importada';
      const valor = Number(linha.valor || linha.Valor || linha.amount || linha.Amount || 0);
      return { data: data_, descricao, valor, externalId: gerarExternalId(data_, valor, descricao) };
    })
    .filter((t) => t.data && !Number.isNaN(t.valor));
}

router.post('/extrato', exigirUsuario, upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

  const nomeArquivo = req.file.originalname.toLowerCase();
  let transacoes = [];
  let origem = '';

  try {
    if (nomeArquivo.endsWith('.ofx')) {
      transacoes = parsearOfx(req.file.buffer.toString('utf-8'));
      origem = 'ofx';
    } else if (nomeArquivo.endsWith('.csv')) {
      transacoes = parseCsv(req.file.buffer);
      origem = 'csv';
    } else if (nomeArquivo.endsWith('.xlsx')) {
      transacoes = parseXlsx(req.file.buffer);
      origem = 'xlsx';
    } else {
      return res.status(400).json({ erro: 'Formato não suportado. Envie um arquivo .ofx, .csv ou .xlsx.' });
    }

    if (transacoes.length === 0) {
      return res.status(400).json({ erro: 'Não foi possível ler nenhuma transação válida do arquivo.' });
    }

    const resultado = await salvarTransacoes(req.userId, transacoes, { origem });
    res.json(resultado);
  } catch (erro) {
    console.error('Erro ao importar extrato:', erro);
    res.status(500).json({ erro: 'Falha ao processar o arquivo enviado.' });
  }
});

export default router;