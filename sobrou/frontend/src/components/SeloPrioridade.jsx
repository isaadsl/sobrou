import { PRIORIDADES } from '../utils/formatadores';
import './SeloPrioridade.css';

export default function SeloPrioridade({ prioridade }) {
  const item = PRIORIDADES.find((p) => p.valor === prioridade) || PRIORIDADES[1];
  return (
    <span className={`selo-prioridade selo-prioridade-${prioridade}`}>
      {item.emoji} {item.rotulo}
    </span>
  );
}
