import './BarraConsumo.css';

export default function BarraConsumo({ percentualComprometido, label = 'Consumo da receita' }) {
  const percentual = Math.min(100, Math.max(0, percentualComprometido));
  const critico = percentual >= 90;
  const alerta = percentual >= 70 && percentual < 90;

  return (
    <div className="barra-consumo">
      <div className="barra-consumo-topo">
        <span>{label}</span>
        <span className="barra-consumo-percentual">{percentual}%</span>
      </div>
      <div className="barra-consumo-trilha">
        <div
          className={`barra-consumo-preenchimento ${critico ? 'critico' : alerta ? 'alerta' : ''}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
