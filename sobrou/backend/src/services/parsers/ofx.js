// Parser simples de OFX (extrato bancário em formato SGML/XML)
// Extrai transações do bloco <STMTTRN>...</STMTTRN>

function extrairTag(bloco, tag) {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i');
  const match = bloco.match(regex);
  return match ? match[1].trim() : null;
}

function formatarDataOfx(dataOfx) {
  if (!dataOfx) return null;
  // formato OFX: AAAAMMDD ou AAAAMMDDHHMMSS[-3:GMT]
  const somenteData = dataOfx.slice(0, 8);
  const ano = somenteData.slice(0, 4);
  const mes = somenteData.slice(4, 6);
  const dia = somenteData.slice(6, 8);
  return `${ano}-${mes}-${dia}`;
}

export function parsearOfx(conteudo) {
  const blocos = conteudo.split(/<STMTTRN>/i).slice(1);
  const transacoes = [];

  for (const blocoBruto of blocos) {
    const bloco = blocoBruto.split(/<\/STMTTRN>/i)[0];

    const tipo = extrairTag(bloco, 'TRNTYPE');
    const dataOfx = extrairTag(bloco, 'DTPOSTED');
    const valorTexto = extrairTag(bloco, 'TRNAMT');
    const memo = extrairTag(bloco, 'MEMO');
    const nome = extrairTag(bloco, 'NAME');
    const fitId = extrairTag(bloco, 'FITID');

    const data = formatarDataOfx(dataOfx);
    const valor = valorTexto ? Number(valorTexto.replace(',', '.')) : null;

    if (!data || valor === null || Number.isNaN(valor)) continue;

    transacoes.push({
      data,
      descricao: memo || nome || tipo || 'Transação importada',
      valor,
      externalId: fitId || `${data}-${valor}-${memo || nome || ''}`,
    });
  }

  return transacoes;
}