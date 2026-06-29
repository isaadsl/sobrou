import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { DESCRICOES_PERFIL } from '../services/perfilComportamental';
import Card from '../components/Card';
import '../styles/formularios.css';
import './Perfil.css';

export default function Perfil() {
  const { perfil, usuario, atualizarPerfil, sair } = useAuth();
  const navigate = useNavigate();

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nome: perfil?.nome || '',
    telefone: perfil?.telefone || '',
    meta_economia_mensal: perfil?.meta_economia_mensal || 0,
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    await atualizarPerfil({
      nome: form.nome,
      telefone: form.telefone,
      meta_economia_mensal: parseFloat(form.meta_economia_mensal) || 0,
    });
    setSalvando(false);
    setEditando(false);
    setMensagem('Perfil atualizado com sucesso.');
    setTimeout(() => setMensagem(''), 3000);
  }

  async function aoSair() {
    await sair();
    navigate('/boas-vindas');
  }

  const infoPerfil = DESCRICOES_PERFIL[perfil?.perfil_comportamental] || DESCRICOES_PERFIL.equilibrado;
  const iniciais = (perfil?.nome || usuario?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Meu Perfil</h1>
          <p>Suas informações e preferências da conta</p>
        </div>
      </header>

      {mensagem && <div className="auth-sucesso">{mensagem}</div>}

      <Card>
        <div className="perfil-cabecalho">
          <div className="perfil-avatar">{iniciais}</div>
          <div>
            <span className="perfil-nome">{perfil?.nome || 'Usuário'}</span>
            <span className="perfil-email">{usuario?.email}</span>
          </div>
        </div>

        {editando ? (
          <form onSubmit={salvar} className="perfil-form">
            <div className="form-campo">
              <label>Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="form-campo">
              <label>Telefone</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div className="form-campo">
              <label>Meta de economia mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.meta_economia_mensal}
                onChange={(e) => setForm({ ...form, meta_economia_mensal: e.target.value })}
              />
            </div>
            <div className="form-acoes">
              <button type="button" className="botao botao-secundario" onClick={() => setEditando(false)}>
                Cancelar
              </button>
              <button type="submit" className="botao botao-primario" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        ) : (
          <div className="perfil-detalhes">
            <div className="perfil-linha">
              <span>Telefone</span>
              <span>{perfil?.telefone || 'Não informado'}</span>
            </div>
            <div className="perfil-linha">
              <span>Meta de economia mensal</span>
              <span>R$ {Number(perfil?.meta_economia_mensal || 0).toFixed(2)}</span>
            </div>
            <button className="botao botao-secundario" onClick={() => setEditando(true)}>
              Editar perfil
            </button>
          </div>
        )}
      </Card>

      <Card titulo="Seu perfil financeiro">
        <div className="perfil-comportamental">
          <span className="perfil-comportamental-emoji">{infoPerfil.emoji}</span>
          <div>
            <span className="perfil-comportamental-rotulo">{infoPerfil.rotulo}</span>
            <p className="perfil-comportamental-descricao">{infoPerfil.descricao}</p>
          </div>
        </div>
        <p className="perfil-comportamental-nota">
          Esse perfil é calculado automaticamente com base no seu histórico de receitas, despesas
          e pontualidade de pagamentos. Ele melhora com o tempo, conforme você usa o app.
        </p>
      </Card>

      <Card titulo="Conta">
        <button className="botao botao-perigo" onClick={aoSair} style={{ width: '100%' }}>
          Sair da conta
        </button>
      </Card>
    </div>
  );
}
