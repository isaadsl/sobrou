import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { formatarMoeda, mesAtualIso } from '../utils/formatadores';
import Card from '../components/Card';
import './Relatorios.css';

const CORES_CATEGORIA = ['#ff3b3b', '#f2b94a', '#2dd4a7', '#6e0e18', '#a3a3ab', '#ff7575', '#e0202f', '#4a0a12', '#c9a84c', '#5b5b63'];

function tooltipEscuro({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grafico-tooltip">
      <strong>{label}</strong>
      {payload.map((item, i) => (
        <div key={i} style={{ color: item.color }}>
          {item.name}: {formatarMoeda(item.value)}
        </div>
      ))}
    </div>
  );
}

export default function Relatorios() {
  const [evolucao, setEvolucao] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const [evolucaoDados, dashboardDados] = await Promise.all([
      api.buscarRelatorios(6),
      api.buscarDashboard(mesAtualIso()),
    ]);
    setEvolucao(
      evolucaoDados.map((item) => ({
        ...item,
        mesRotulo: item.mes.split('-')[1] + '/' + item.mes.split('-')[0].slice(2),
      }))
    );
    setDashboard(dashboardDados);
    setCarregando(false);
  }

  if (carregando) return <p className="pagina-vazio">Carregando relatórios...</p>;

  const dadosCategorias = Object.entries(dashboard.gastos_por_categoria).map(([nome, valor]) => ({
    nome,
    valor,
  }));

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Relatórios</h1>
          <p>Entenda para onde seu dinheiro está indo</p>
        </div>
      </header>

      <div className="relatorios-grade">
        <Card titulo="Evolução: receitas vs despesas" className="relatorio-card-grande">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" vertical={false} />
              <XAxis dataKey="mesRotulo" stroke="#a3a3ab" fontSize={12} />
              <YAxis stroke="#a3a3ab" fontSize={12} />
              <Tooltip content={tooltipEscuro} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Bar dataKey="receitas" name="Receitas" fill="#2dd4a7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ff3b3b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card titulo="Gastos por categoria">
          {dadosCategorias.length === 0 ? (
            <p className="pagina-vazio">Sem despesas este mês ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dadosCategorias}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {dadosCategorias.map((_, i) => (
                    <Cell key={i} fill={CORES_CATEGORIA[i % CORES_CATEGORIA.length]} />
                  ))}
                </Pie>
                <Tooltip content={tooltipEscuro} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card titulo="Percentual comprometido da renda">
          <div className="relatorio-percentual-grande">
            {dashboard.percentual_comprometido}%
          </div>
          <p className="relatorio-percentual-legenda">
            da sua receita mensal já está comprometida com despesas.
          </p>
        </Card>

        <Card titulo="Economia mensal (últimos 6 meses)" className="relatorio-card-grande">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" vertical={false} />
              <XAxis dataKey="mesRotulo" stroke="#a3a3ab" fontSize={12} />
              <YAxis stroke="#a3a3ab" fontSize={12} />
              <Tooltip content={tooltipEscuro} />
              <Line
                type="monotone"
                dataKey="economia"
                name="Economia"
                stroke="#ff3b3b"
                strokeWidth={2.5}
                dot={{ fill: '#ff3b3b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
