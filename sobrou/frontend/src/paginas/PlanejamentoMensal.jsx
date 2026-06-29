import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, formatarData, mesAtualIso, nomeMes } from '../utils/formatadores';
import Card from '../components/Card';
import './PlanejamentoMensal.css';

export default function PlanejamentoMensal() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const mes = mesAtualIso();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const resposta = await api.buscarPlanejamentoMensal(mes);
    setDados(resposta);
    setCarregando(false);
  }

  if (carregando) return <p className="pagina-vazio">Carregando...</p>;

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Planejamento Mensal</h1>
          <p>Sua visão completa de {nomeMes(mes)}</p>
        </div>
      </header>

      <Card titulo="Saldo projetado para o fim do mês">
        <div className={`saldo-projetado ${dados.saldo_projetado < 0 ? 'negativo' : ''}`}>
          {formatarMoeda(dados.saldo_projetado)}
        </div>
        <p className="saldo-projetado-legenda">
          Considerando todas as receitas e despesas já cadastradas para este mês.
        </p>
      </Card>

      <div className="planejamento-colunas">
        <Card titulo="Recebimentos previstos">
          {dados.recebimentos_futuros.length === 0 ? (
            <p className="pagina-vazio">Nenhum recebimento futuro neste mês.</p>
          ) : (
            <ul className="lista-simples">
              {dados.recebimentos_futuros.map((r) => (
                <li key={r.id}>
                  <span>{r.nome} · {formatarData(r.data_recebimento)}</span>
                  <span className="valor-monetario cor-positiva">{formatarMoeda(r.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Contas futuras">
          {dados.contas_futuras.length === 0 ? (
            <p className="pagina-vazio">Nenhuma conta pendente futura.</p>
          ) : (
            <ul className="lista-simples">
              {dados.contas_futuras.map((d) => (
                <li key={d.id}>
                  <span>{d.nome} · vence {formatarData(d.data_vencimento)}</span>
                  <span className="valor-monetario cor-negativa">{formatarMoeda(d.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Gastos já realizados">
          {dados.gastos_realizados.length === 0 ? (
            <p className="pagina-vazio">Nenhum gasto pago ainda este mês.</p>
          ) : (
            <ul className="lista-simples">
              {dados.gastos_realizados.map((d) => (
                <li key={d.id}>
                  <span>{d.nome}</span>
                  <span className="valor-monetario">{formatarMoeda(d.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
