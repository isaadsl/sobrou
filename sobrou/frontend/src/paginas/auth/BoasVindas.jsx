import { useNavigate } from 'react-router-dom';
import '../../styles/formularios.css';
import './Auth.css';

export default function BoasVindas() {
  const navigate = useNavigate();

  return (
    <div className="auth-pagina">
      <div className="boas-vindas-caixa">
        <div className="boas-vindas-icone">S</div>
        <h1 className="boas-vindas-nome">Sobrou</h1>
        <p className="boas-vindas-slogan">Visualize, planeje e economize.</p>

        <div className="boas-vindas-botoes">
          <button className="botao botao-primario" onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="botao botao-secundario" onClick={() => navigate('/cadastro')}>
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
