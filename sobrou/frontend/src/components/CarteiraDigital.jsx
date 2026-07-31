import { formatarMoeda } from '../utils/formatadores';
import './CarteiraDigital.css';

export default function CarteiraDigital({
  saldoDisponivel,
  totalReceitas,
  percentualComprometido,
  saldoValeRefeicao,
  totalValeRefeicao = 0, 
  percentualComprometidoVale = 0 
}) {
 
  const percentualDisponivel = Math.max(0, 100 - percentualComprometido);
  const saldoNegativo = saldoDisponivel < 0;


  const percentualDisponivelVale = Math.max(0, 100 - percentualComprometidoVale);
  const saldoValeNegativo = saldoValeRefeicao < 0;

  return (
    <div>
      {/* Card do salário principal */}
      <div className={`carteira ${saldoNegativo ? 'carteira-negativa' : ''}`}>
        <div
          className="carteira-preenchimento"
          style={{ width: `${saldoNegativo ? 100 : percentualDisponivel}%` }}
        />

        <div className="carteira-conteudo">
          <div className="carteira-topo">
            <span className="carteira-rotulo">Saldo principal</span>
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

      {/* Card do Vale Refeição */}
      <div className={`carteira ${saldoValeNegativo ? 'carteira-negativa' : ''}`}>
        <div
          className="carteira-preenchimento"
          style={{ width: `${saldoValeNegativo ? 100 : percentualDisponivelVale}%` }}
        />

        <div className="carteira-conteudo">
          <div className="carteira-topo">
            <span className="carteira-rotulo">Vale Refeição</span>
            <span className="carteira-chip">🍽️</span>
          </div>

          <div className="carteira-valor valor-monetario">
            {formatarMoeda(saldoValeRefeicao)}
          </div>

          <div className="carteira-base">
            <span>de {formatarMoeda(totalValeRefeicao)} recebidos</span>
            <span className="carteira-percentual">
              {percentualComprometidoVale}% comprometido
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
