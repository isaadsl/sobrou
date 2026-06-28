import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexto/AuthContext';
import LogoMarca from '../../components/LogoMarca';
import { traduzirErroSupabase } from '../../utils/formatadores';
import '../../styles/formularios.css';
import './Auth.css';

export default function Login() {
  const { entrarComEmail } = useAuth();
  const navigate = useNavigate();

  const [emailOuTelefone, setEmailOuTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEntrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await entrarComEmail({ email: emailOuTelefone.trim(), senha });

    setCarregando(false);

    if (error) {
      setErro(traduzirErroSupabase(error.message));
      return;
    }

    navigate('/');
  }

  return (
    <div className="auth-pagina">
      <div className="auth-caixa">
        <div className="auth-marca">
          <LogoMarca tamanho="medio" />
          <span className="auth-marca-slogan">Visualize, planeje e economize.</span>
        </div>

        <h2 className="auth-titulo">Entrar na sua conta</h2>

        {erro && <div className="auth-erro">{erro}</div>}
        
        <div className="auth-divisor">ou entre com e-mail / telefone</div>

        <form onSubmit={aoEntrar}>
          <div className="form-campo">
            <label>E-mail ou telefone</label>
            <input
              type="text"
              placeholder="voce@email.com"
              value={emailOuTelefone}
              onChange={(e) => setEmailOuTelefone(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-campo">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/esqueci-senha" className="auth-link">Esqueci minha senha</Link>
          <span className="auth-texto-secundario">
            Não tem conta? <Link to="/cadastro" className="auth-link">Criar conta</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
