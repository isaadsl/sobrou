import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexto/AuthContext';
import LogoMarca from '../../components/LogoMarca';
import { traduzirErroSupabase } from '../../utils/formatadores';
import '../../styles/formularios.css';
import './Auth.css';

export default function EsqueciSenha() {
  const { recuperarSenha } = useAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await recuperarSenha(email.trim());

    setCarregando(false);

    if (error) {
      setErro(traduzirErroSupabase(error.message));
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="auth-pagina">
      <div className="auth-caixa">
        <div className="auth-marca">
          <LogoMarca tamanho="medio" />
          <span className="auth-marca-slogan">Visualize, planeje e economize.</span>
        </div>

        <h2 className="auth-titulo">Recuperar senha</h2>

        {erro && <div className="auth-erro">{erro}</div>}

        {enviado ? (
          <div className="auth-sucesso">
            Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha em poucos minutos.
          </div>
        ) : (
          <form onSubmit={aoEnviar}>
            <div className="form-campo">
              <label>E-mail da sua conta</label>
              <input
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={carregando}>
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login" className="auth-link">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
