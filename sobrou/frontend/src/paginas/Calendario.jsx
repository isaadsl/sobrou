import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, mesAtualIso, nomeMes } from '../utils/formatadores';
import Card from '../components/Card';
import './Calendario.css';

function gerarDiasDoMes(mesIso) {
  const [ano, mes] = mesIso.split('-').map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();

  const dias = [];
  for (let i = 0; i < diaSemanaInicio; i++) dias.push(null);
  for (let dia = 1; dia <= diasNoMes; dia++) {
    dias.push(`${mesIso}-${String(dia).padStart(2, '0')}`);
  }
  return dias;
}

export default function Calendario() {
  const [mes, setMes] = useState(mesAtualIso());
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [mes]);

  async function carregar() {
    setCarregando(true);
    const dados = await api.buscarCalendario(mes);
    setEventos(dados);
    setCarregando(false);
  }

  function mudarMes(delta) {
    const [ano, m] = mes.split('-').map(Number);
    const data = new Date(ano, m - 1 + delta, 1);
    setMes(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
  }

  const dias = gerarDiasDoMes(mes);
  const eventosPorDia = {};
  eventos.forEach((ev) => {
    if (!eventosPorDia[ev.data]) eventosPorDia[ev.data] = [];
    eventosPorDia[ev.data].push(ev);
  });

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Calendário Financeiro</h1>
          <p>Visualize recebimentos e vencimentos do mês</p>
        </div>
        <div className="calendario-navegacao">
          <button className="botao botao-secundario" onClick={() => mudarMes(-1)}>←</button>
          <span className="calendario-mes-atual">{nomeMes(mes)}</span>
          <button className="botao botao-secundario" onClick={() => mudarMes(1)}>→</button>
        </div>
      </header>

      <Card>
        <div className="calendario-legenda">
          <span>💰 Recebimento</span>
          <span>🧾 Vencimento</span>
          <span>✅ Paga</span>
          <span>⚠️ Vence em breve</span>
        </div>

        {carregando ? (
          <p className="pagina-vazio">Carregando...</p>
        ) : (
          <div className="calendario-grade">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia} className="calendario-dia-semana">{dia}</div>
            ))}
            {dias.map((dataIso, idx) => {
              if (!dataIso) return <div key={`vazio-${idx}`} className="calendario-celula calendario-celula-vazia" />;
              const numeroDia = Number(dataIso.split('-')[2]);
              const eventosDoDia = eventosPorDia[dataIso] || [];

              return (
                <div key={dataIso} className="calendario-celula">
                  <span className="calendario-numero-dia">{numeroDia}</span>
                  <div className="calendario-eventos">
                    {eventosDoDia.slice(0, 3).map((ev, i) => (
                      <span key={i} className="calendario-evento" title={`${ev.descricao} · ${formatarMoeda(ev.valor)}`}>
                        {ev.icone}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
