import { formatarMoeda } from '../utils/formatadores';
import './CarteiraDigital.css';

export default function CarteiraDigital({ saldoDisponivel, totalReceitas, percentualComprometido }) {
  const percentualDisponivel = Math.max(0, 100 - percentualComprometido);
  const saldoNegativo = saldoDisponivel < 0;

  return (
    <div className={`carteira ${saldoNegativo ? 'carteira-negativa' : ''}`}>
      <div
        className="carteira-preenchimento"
        style={{ width: `${saldoNegativo ? 100 : percentualDisponivel}%` }}
      />

      <div className="carteira-conteudo">
        <div className="carteira-topo">
          <span className="carteira-rotulo">Saldo disponível</span>
          <span className="carteira-chip">₪</span>
        </div>

        <div className="carteira-valor valor-monetario">
          {formatarMoeda(saldoDisponivel)}
        </div>

        <div className="carteira-base">
          <span>de {formatarMoeda(totalReceitas)} recebidos</span>
          <span className="carteira-percentual">
            {percentualComprometido}% comprometido
          </span>
        </div>
      </div>
    </div>
  );
}
