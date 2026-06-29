import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, formatarData, CATEGORIAS, PRIORIDADES } from '../utils/formatadores';
import Card from '../components/Card';
import Modal from '../components/Modal';
import SeloPrioridade from '../components/SeloPrioridade';
import '../styles/formularios.css';
import './ListaFinanceira.css';

const FORM_VAZIO = {
  nome: '',
  valor: '',
  categoria: 'Outros',
  data_vencimento: '',
  prioridade: 'media',
  status: 'pendente',
  observacoes: '',
};

export default function Despesas() {
  const [despesas, setDespesas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    carregar();
  }, [filtroStatus, filtroCategoria]);

  async function carregar() {
    setCarregando(true);
    const params = {};
    if (filtroStatus) params.status = filtroStatus;
    if (filtroCategoria) params.categoria = filtroCategoria;
    const dados = await api.listarDespesas(params);
    setDespesas(dados);
    setCarregando(false);
  }

  function abrirModal() {
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome || !form.valor || !form.data_vencimento) return;

    setSalvando(true);
    try {
      await api.criarDespesa({ ...form, valor: parseFloat(form.valor) });
      setModalAberto(false);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(id) {
    await api.alternarStatusDespesa(id);
    await carregar();
  }

  async function excluir(id) {
    await api.excluirDespesa(id);
    await carregar();
  }

  const totalGeral = despesas.reduce((soma, d) => soma + d.valor, 0);

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Despesas</h1>
          <p>Tudo que sai do seu bolso, organizado por prioridade</p>
        </div>
        <button className="botao botao-primario" onClick={abrirModal}>
          + Nova despesa
        </button>
      </header>

      <Card>
        <div className="resumo-total">
          <span>Total de despesas</span>
          <span className="valor-monetario resumo-total-valor cor-negativa">
            {formatarMoeda(totalGeral)}
          </span>
        </div>
      </Card>

      <div className="filtros-barra">
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="paga">Pagas</option>
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {carregando ? (
        <p className="pagina-vazio">Carregando...</p>
      ) : despesas.length === 0 ? (
        <p className="pagina-vazio">Nenhuma despesa encontrada.</p>
      ) : (
        <div className="lista-cartoes">
          {despesas.map((despesa) => (
            <div key={despesa.id} className="item-cartao">
              <div className="item-cartao-info">
                <span className="item-cartao-nome">{despesa.nome}</span>
                <span className="item-cartao-meta">
                  {despesa.categoria} · vence em {formatarData(despesa.data_vencimento)}
                </span>
              </div>
              <div className="item-cartao-acoes">
                <div className="item-cartao-tags">
                  <SeloPrioridade prioridade={despesa.prioridade} />
                  <button
                    className={`item-cartao-status ${despesa.status === 'paga' ? 'status-paga' : 'status-pendente'}`}
                    onClick={() => alternarStatus(despesa.id)}
                  >
                    {despesa.status === 'paga' ? 'Paga' : 'Pendente'}
                  </button>
                </div>
                <span className="valor-monetario cor-negativa">{formatarMoeda(despesa.valor)}</span>
                <button className="botao-fantasma" onClick={() => excluir(despesa.id)} aria-label="Excluir">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Nova despesa" onFechar={() => setModalAberto(false)}>
        <form onSubmit={salvar}>
          <div className="form-campo">
            <label>Nome da despesa</label>
            <input
              type="text"
              placeholder="Ex: Aluguel, Internet, Mercado..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>

          <div className="form-linha">
            <div className="form-campo">
              <label>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                required
              />
            </div>
            <div className="form-campo">
              <label>Data de vencimento</label>
              <input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-linha">
            <div className="form-campo">
              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-campo">
              <label>Prioridade</label>
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
                {PRIORIDADES.map((p) => (
                  <option key={p.valor} value={p.valor}>{p.emoji} {p.rotulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-campo">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="paga">Paga</option>
            </select>
          </div>

          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar despesa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
