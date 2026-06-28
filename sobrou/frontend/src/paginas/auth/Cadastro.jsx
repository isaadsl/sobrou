import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexto/AuthContext';
import LogoMarca from '../../components/LogoMarca';
import { traduzirErroSupabase } from '../../utils/formatadores';
import '../../styles/formularios.css';
import './Auth.css';

export default function Cadastro() {
  const { cadastrar} = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoCadastrar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (form.senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    const { data, error } = await cadastrar(form);
    setCarregando(false);

    if (error) {
      setErro(traduzirErroSupabase(error.message));
      return;
    }

    if (data?.session) {
      navigate('/');
    } else {
      setSucesso('Conta criada! Verifique seu e-mail para confirmar antes de entrar.');
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-caixa">
        <div className="auth-marca">
          <LogoMarca tamanho="medio" />
          <span className="auth-marca-slogan">Visualize, planeje e economize.</span>
        </div>

        <h2 className="auth-titulo">Criar sua conta</h2>

        {erro && <div className="auth-erro">{erro}</div>}
        {sucesso && <div className="auth-sucesso">{sucesso}</div>}

        <div className="auth-divisor">Cadastre-se com e-mail</div>

        <form onSubmit={aoCadastrar}>
          <div className="form-campo">
            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>

          <div className="form-campo">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-campo">
            <label>Número de telefone (opcional)</label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </div>

          <div className="form-campo">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-links">
          <span className="auth-texto-secundario">
            Já tem conta? <Link to="/login" className="auth-link">Entrar</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
