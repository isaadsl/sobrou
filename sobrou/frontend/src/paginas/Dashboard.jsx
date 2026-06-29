import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, mesAtualIso, nomeMes } from '../utils/formatadores';
import CarteiraDigital from '../components/CarteiraDigital';
import BarraConsumo from '../components/BarraConsumo';
import Card from '../components/Card';
import SeloPrioridade from '../components/SeloPrioridade';
import './Dashboard.css';

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const mes = mesAtualIso();

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    try {
      setCarregando(true);
      const resposta = await api.buscarDashboard(mes);
      setDados(resposta);
      setErro(null);
    } catch (e) {
      setErro('Não foi possível carregar os dados. Verifique sua conexão e as configurações do Supabase (.env).');
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return <div className="dashboard-carregando">Carregando seu painel financeiro...</div>;
  }

  if (erro) {
    return (
      <div className="dashboard-erro">
        <p>{erro}</p>
      </div>
    );
  }

  const proximasDespesas = dados.despesas_por_prioridade
    .filter((d) => d.status !== 'paga')
    .slice(0, 5);

  return (
    <div className="dashboard">
      <header className="dashboard-cabecalho">
        <h1>Olá! Aqui está seu resumo</h1>
        <p>{nomeMes(mes)}</p>
      </header>

      <div className="dashboard-grade-principal">
        <CarteiraDigital
          saldoDisponivel={dados.saldo_disponivel}
          totalReceitas={dados.total_receitas}
          percentualComprometido={dados.percentual_comprometido}
        />

        <div className="dashboard-mini-cards">
          <div className="mini-card">
            <span className="mini-card-rotulo">Receitas do mês</span>
            <span className="mini-card-valor valor-monetario cor-positiva">
              {formatarMoeda(dados.total_receitas)}
            </span>
          </div>
          <div className="mini-card">
            <span className="mini-card-rotulo">Despesas do mês</span>
            <span className="mini-card-valor valor-monetario cor-negativa">
              {formatarMoeda(dados.total_despesas)}
            </span>
          </div>
          <div className="mini-card">
            <span className="mini-card-rotulo">Economizado</span>
            <span className="mini-card-valor valor-monetario">
              {formatarMoeda(dados.economizado)}
            </span>
          </div>
        </div>
      </div>

      <Card titulo="Consumo financeiro do mês">
        <BarraConsumo percentualComprometido={dados.percentual_comprometido} />
        <div className="dashboard-legenda-consumo">
          <span>{formatarMoeda(dados.despesas_pagas)} já pago</span>
          <span>{formatarMoeda(dados.despesas_pendentes)} pendente</span>
        </div>
      </Card>

      <Card titulo="Próximas contas por prioridade">
        {proximasDespesas.length === 0 ? (
          <p className="dashboard-vazio">Nenhuma despesa pendente este mês. </p>
        ) : (
          <ul className="dashboard-lista-despesas">
            {proximasDespesas.map((despesa) => (
              <li key={despesa.id} className="dashboard-item-despesa">
                <div className="dashboard-item-info">
                  <span className="dashboard-item-nome">{despesa.nome}</span>
                  <SeloPrioridade prioridade={despesa.prioridade} />
                </div>
                <span className="valor-monetario">{formatarMoeda(despesa.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
