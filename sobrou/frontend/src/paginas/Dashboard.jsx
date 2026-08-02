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
  const [contasBancarias, setContasBancarias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const mes = mesAtualIso();

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    try {
      setCarregando(true);
      const [resposta, contas] = await Promise.all([
        api.buscarDashboard(mes),
        api.buscarSaldoContas(),
      ]);
      setDados(resposta);
      setContasBancarias(contas);
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
    ? dados.despesas_por_prioridade.filter((d) => d.status !== 'paga').slice(0, 5)
    : [];

  const categorias = dados.gastos_por_categoria
    ? Object.entries(dados.gastos_por_categoria)
        .filter(([, valor]) => valor > 0)
        .sort((a, b) => b[1] - a[1])
    : [];
  const totalCategorias = categorias.reduce((soma, [, valor]) => soma + valor, 0);
  const saldoTotalContas = contasBancarias.reduce((soma, c) => soma + Number(c.saldo || 0), 0);

  return (
    <div className="dashboard">
      <header className="dashboard-cabecalho">
        <h1>Olá! Aqui está seu resumo</h1>
        <p>{nomeMes(mes)}</p>
      </header>

      <div className="dashboard-grade-principal">
        <CarteiraDigital
          saldoDisponivel={dados.saldo_disponivel + saldoTotalContas}
          totalReceitas={dados.total_receitas}
          percentualComprometido={dados.percentual_comprometido}
          saldoValeRefeicao={dados.saldo_vale_refeicao}
          totalValeRefeicao={dados.total_receitas_vale_refeicao}
          percentualComprometidoVale={dados.percentual_comprometido_vale_refeicao}
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

      <Card titulo="Gastos por categoria">
        {categorias.length === 0 ? (
          <p className="dashboard-vazio">Nenhum gasto categorizado este mês ainda.</p>
        ) : (
          <ul className="dashboard-lista-categorias">
            {categorias.map(([categoria, valor]) => {
              const percentual = totalCategorias > 0 ? Math.round((valor / totalCategorias) * 100) : 0;
              return (
                <li key={categoria} className="dashboard-item-categoria">
                  <div className="dashboard-item-categoria-topo">
                    <span className="dashboard-item-categoria-nome">{categoria}</span>
                    <span className="valor-monetario">{formatarMoeda(valor)}</span>
                  </div>
                  <div className="dashboard-item-categoria-barra-fundo">
                    <div
                      className="dashboard-item-categoria-barra-preenchida"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                  <span className="dashboard-item-categoria-percentual">{percentual}% do total gasto</span>
                </li>
              );
            })}
          </ul>
        )}
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