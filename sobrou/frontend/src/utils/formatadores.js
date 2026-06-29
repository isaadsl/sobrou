export function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarData(dataIso) {
  if (!dataIso) return '';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataExtensa(dataIso) {
  if (!dataIso) return '';
  const data = new Date(`${dataIso}T00:00:00`);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function mesAtualIso() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

export function nomeMes(mesIso) {
  const [ano, mes] = mesIso.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  const nome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export const CATEGORIAS = [
  'Moradia',
  'Contas',
  'Alimentação',
  'Transporte',
  'Educação',
  'Saúde',
  'Lazer',
  'Compras',
  'Assinaturas',
  'Outros',
];

export const PRIORIDADES = [
  { valor: 'alta', rotulo: 'Alta', emoji: '🔴' },
  { valor: 'media', rotulo: 'Média', emoji: '🟠' },
  { valor: 'baixa', rotulo: 'Baixa', emoji: '🟢' },
];

export function corPrioridade(prioridade) {
  switch (prioridade) {
    case 'alta':
      return '#ff3b3b';
    case 'media':
      return '#f2b94a';
    case 'baixa':
      return '#2dd4a7';
    default:
      return '#a3a3ab';
  }
}

export function traduzirErroSupabase(mensagem) {
  if (!mensagem) return 'Ocorreu um erro inesperado. Tente novamente.';

  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).';
  if (mensagem.includes('already registered') || mensagem.includes('already exists')) return 'Já existe uma conta com este e-mail.';
  if (mensagem.includes('Password should be')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (mensagem.includes('User not found')) return 'Não encontramos uma conta com este e-mail.';
  if (mensagem.includes('rate limit') || mensagem.includes('Too many requests')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (mensagem.includes('expired') || mensagem.includes('Email link is invalid')) return 'Esse link expirou ou já foi usado.';
  if (mensagem.includes('Unable to validate email') || mensagem.includes('invalid')) return 'Verifique se o e-mail foi digitado corretamente.';

  return mensagem;
}
