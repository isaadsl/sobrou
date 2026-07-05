import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, formatarData } from '../utils/formatadores';
import Card from '../components/Card';
import Modal from '../components/Modal';
import '../styles/formularios.css';
import './ListaFinanceira.css';

const TIPOS_RECEITA = ['Salário', 'Trabalho extra', 'Freelance', 'Comissão', 'Bonificação', 'Outras entradas'];

const FORM_VAZIO = {
  nome: '',
  valor: '',
  data_recebimento: '',
  tipo: 'Salário',
  observacoes: '',
  destino: 'principal', // Adicionando o campo destino com valor padrão
};

export default function Receitas() {
  const [receitas, setReceitas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await api.listarReceitas();
    setReceitas(dados);
    setCarregando(false);
  }

  function abrirModal() {
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome || !form.valor || !form.data_recebimento) return;

    setSalvando(true);
    try {
      await api.criarReceita({ ...form, valor: parseFloat(form.valor) });
      setModalAberto(false);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    await api.excluirReceita(id);
    await carregar();
  }

  const totalGeral = receitas.reduce((soma, r) => soma + r.valor, 0);

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Receitas</h1>
          <p>Tudo que entra no seu bolso</p>
        </div>
        <button className="botao botao-primario" onClick={abrirModal}>
          + Nova receita
        </button>
      </header>

      <Card>
        <div className="resumo-total">
          <span>Total recebido</span>
          <span className="valor-monetario resumo-total-valor">{formatarMoeda(totalGeral)}</span>
        </div>
      </Card>

      {carregando ? (
        <p className="pagina-vazio">Carregando...</p>
      ) : receitas.length === 0 ? (
        <p className="pagina-vazio">Nenhuma receita cadastrada ainda. Adicione a primeira!</p>
      ) : (
        <div className="lista-cartoes">
          {receitas.map((receita) => (
            <div key={receita.id} className="item-cartao">
              <div className="item-cartao-info">
                <span className="item-cartao-nome">{receita.nome}</span>
                <span className="item-cartao-meta">
                  {receita.tipo} · {formatarData(receita.data_recebimento)}
                </span>
                {receita.observacoes && (
                  <span className="item-cartao-obs">{receita.observacoes}</span>
                )}
              </div>
              <div className="item-cartao-acoes">
                <span className="valor-monetario cor-positiva">{formatarMoeda(receita.valor)}</span>
                <button className="botao-fantasma" onClick={() => excluir(receita.id)} aria-label="Excluir">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Nova receita" onFechar={() => setModalAberto(false)}>
        <form onSubmit={salvar}>
          <div className="form-campo">
            <label>Nome da receita</label>
            <input
              type="text"
              placeholder="Ex: Salário, Freelance design..."
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
              <label>Data de recebimento</label>
              <input
                type="date"
                value={form.data_recebimento}
                onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-campo">
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_RECEITA.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="form-campo">
            <label>Destino</label>
            <select
              value={form.destino}
              onChange={(e) => setForm({ ...form, destino: e.target.value })}
              >
                <option value="principal">Saldo principal</option>
                <option value="vale_refeicao">Vale Refeição</option>
              </select>
            </div>

          <div className="form-campo">
            <label>Observações (opcional)</label>
            <textarea
              rows={2}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>

          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar receita'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
