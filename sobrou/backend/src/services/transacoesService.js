import supabaseAdmin from './supabaseAdmin.js';

// Mapeamento de palavras-chave (em maiúsculas) para categorias.
// A ordem importa: a primeira categoria com palavra-chave encontrada na
// descrição é usada. Ajuste/adicione palavras conforme forem aparecendo
// transações mal categorizadas.
const REGRAS_CATEGORIA = [
  {
    categoria: 'Alimentação',
    palavras: [
      'IFOOD', 'IFD', 'RAPPI', 'UBER EATS', 'MERCADO', 'SUPERMERCADO',
      'PADARIA', 'RESTAURANTE', 'LANCHONETE', 'PIZZARIA', 'AÇOUGUE',
      'ACOUGUE', 'HORTIFRUTI', 'FEIRA', 'BURGER', 'CAFE', 'CAFÉ',
      'ATACADAO', 'ATACADÃO', 'CARREFOUR', 'PAO DE ACUCAR', 'EXTRA',
      'DELIVERY', 'VR REFEICAO', 'VR ALIMENTACAO', 'SODEXO', 'ALELO',
    ],
  },
  {
    categoria: 'Transporte',
    palavras: [
      'UBER', '99APP', '99POP', 'POSTO', 'COMBUSTIVEL', 'COMBUSTÍVEL',
      'GASOLINA', 'ETANOL', 'ESTACIONAMENTO', 'PEDAGIO', 'PEDÁGIO',
      'METRO', 'METRÔ', 'ONIBUS', 'ÔNIBUS', 'BILHETE UNICO', 'CABIFY',
      'IPVA', 'DETRAN', 'OFICINA', 'AUTO PECAS', 'AUTOPEÇAS',
    ],
  },
  {
    categoria: 'Moradia',
    palavras: [
      'ALUGUEL', 'CONDOMINIO', 'CONDOMÍNIO', 'IPTU', 'IMOBILIARIA',
      'IMOBILIÁRIA', 'REFORMA', 'CONSTRUCAO', 'CONSTRUÇÃO',
    ],
  },
  {
    categoria: 'Contas',
    palavras: [
      'ENERGIA', 'ELETROPAULO', 'CPFL', 'LIGHT', 'SABESP', 'COPASA',
      'ÁGUA', 'AGUA', 'VIVO', 'CLARO', 'TIM', 'OI ', 'INTERNET',
      'GAS', 'GÁS', 'COMGAS', 'BOLETO', 'FATURA', 'TAXA', 'TARIFA',
    ],
  },
  {
    categoria: 'Saúde',
    palavras: [
      'FARMACIA', 'FARMÁCIA', 'DROGARIA', 'DROGASIL', 'RAIA',
      'PACHECO', 'HOSPITAL', 'CLINICA', 'CLÍNICA', 'LABORATORIO',
      'LABORATÓRIO', 'PLANO DE SAUDE', 'UNIMED', 'AMIL', 'SULAMERICA',
      'DENTISTA', 'PSICOLOGO', 'PSICÓLOGO', 'ACADEMIA', 'SMARTFIT',
      'BIOFIT',
    ],
  },
  {
    categoria: 'Educação',
    palavras: [
      'FACULDADE', 'UNIVERSIDADE', 'ESCOLA', 'CURSO', 'UDEMY',
      'ALURA', 'MENSALIDADE ESCOLAR', 'MATERIAL ESCOLAR', 'LIVRARIA',
    ],
  },
  {
    categoria: 'Assinaturas',
    palavras: [
      'NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'PRIME VIDEO', 'DISNEY',
      'HBO', 'YOUTUBE PREMIUM', 'ICLOUD', 'GOOGLE ONE', 'PLAYSTATION',
      'XBOX', 'DEEZER', 'APPLE.COM/BILL', 'ASSINATURA',
    ],
  },
  {
    categoria: 'Lazer',
    palavras: [
      'CINEMA', 'INGRESSO', 'SHOW', 'BAR ', 'BALADA', 'TEATRO',
      'PARQUE', 'VIAGEM', 'HOTEL', 'POUSADA', 'AIRBNB', 'DECOLAR',
      'CVC',
    ],
  },
  {
    categoria: 'Compras',
    palavras: [
      'MERCADO LIVRE', 'AMAZON', 'SHOPEE', 'MAGALU', 'MAGAZINE LUIZA',
      'SHEIN', 'RENNER', 'C&A', 'RIACHUELO', 'CENTAURO', 'LOJA',
      'SHOPPING',
    ],
  },
];

function categorizarDescricao(descricao) {
  if (!descricao) return 'Outros';
  const texto = descricao.toUpperCase();

  for (const regra of REGRAS_CATEGORIA) {
    if (regra.palavras.some((palavra) => texto.includes(palavra))) {
      return regra.categoria;
    }
  }

  return 'Outros';
}

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
      despesas.push({
        ...base,
        data_vencimento: t.data,
        categoria: categorizarDescricao(t.descricao),
        status: 'paga',
        prioridade: 'media',
        destino: 'principal',
      });
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