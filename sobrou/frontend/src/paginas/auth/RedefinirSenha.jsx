import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexto/AuthContext';
import LogoMarca from '../../components/LogoMarca';
import { traduzirErroSupabase } from '../../utils/formatadores';
import '../../styles/formularios.css';
import './Auth.css';

function erroNaUrlDeRetorno() {
  const hash = window.location.hash || '';
  const parametros = new URLSearchParams(hash.replace(/^#/, ''));
  const descricao = parametros.get('error_description');
  return descricao ? decodeURIComponent(descricao.replace(/\+/g, ' ')) : null;
}

export default function RedefinirSenha() {
  const { atualizarSenha, autenticado, carregando: carregandoSessao } = useAuth();
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState(() => {
    const descricao = erroNaUrlDeRetorno();
    return descricao ? `O link de redefinição não é mais válido: ${traduzirErroSupabase(descricao)}` : '';
  });
  const [carregando, setCarregando] = useState(false);

  async function aoSalvar(e) {
    e.preventDefault();
    setErro('');

    if (novaSenha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    const { error } = await atualizarSenha(novaSenha);
    setCarregando(false);

    if (error) {
      setErro(traduzirErroSupabase(error.message));
      return;
    }

    navigate('/');
  }

  const linkInvalido = !carregandoSessao && !autenticado && !!erroNaUrlDeRetorno();

  return (
    <div className="auth-pagina">
      <div className="auth-caixa">
        <div className="auth-marca">
          <LogoMarca tamanho="medio" />
          <span className="auth-marca-slogan">Visualize, planeje e economize.</span>
        </div>

        <h2 className="auth-titulo">Definir nova senha</h2>

        {erro && <div className="auth-erro">{erro}</div>}

        {linkInvalido ? (
          <div className="auth-links">
            <Link to="/esqueci-senha" className="auth-link">Solicitar um novo link de redefinição</Link>
          </div>
        ) : (
          <form onSubmit={aoSalvar}>
            <div className="form-campo">
              <label>Nova senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
            <div className="form-campo">
              <label>Confirmar nova senha</label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
