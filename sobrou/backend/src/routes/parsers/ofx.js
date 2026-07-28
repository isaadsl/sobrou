function extrairTag(bloco, tag) {
  const match = bloco.match(new RegExp(`<${tag}>([^<\r\n]*)`));
  return match ? match[1].trim() : '';
}

function formatarDataOfx(valor) {
  if (!valor) return null;
  const ano = valor.slice(0, 4);
  const mes = valor.slice(4, 6);
  const dia = valor.slice(6, 8);
  return `${ano}-${mes}-${dia}`;
}

export function parseOfx(conteudo) {
  const blocos = conteudo.split('<STMTTRN>').slice(1);
  return blocos
    .map((bloco) => {
      const valor = Number(extrairTag(bloco, 'TRNAMT'));
      const data = formatarDataOfx(extrairTag(bloco, 'DTPOSTED'));
      const descricao = extrairTag(bloco, 'MEMO') || extrairTag(bloco, 'NAME') || 'Transação importada';
      const fitid = extrairTag(bloco, 'FITID');
      return {
        data,
        descricao,
        valor,
        externalId: fitid || `${data}|${valor}|${descricao}`,
      };
    })
    .filter((t) => t.data && !Number.isNaN(t.valor));
}