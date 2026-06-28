import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, formatarData } from '../utils/formatadores';
import Card from '../components/Card';
import Modal from '../components/Modal';
import BarraConsumo from '../components/BarraConsumo';
import '../styles/formularios.css';
import './Metas.css';

const FORM_VAZIO = { nome: '', valor_meta: '', valor_guardado: '', data_alvo: '' };

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAporteAberto, setModalAporteAberto] = useState(null); // meta selecionada
  const [valorAporte, setValorAporte] = useState('');
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await api.listarMetas();
    setMetas(dados);
    setCarregando(false);
  }

  function abrirModal() {
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome || !form.valor_meta) return;

    setSalvando(true);
    try {
      await api.criarMeta({
        ...form,
        valor_meta: parseFloat(form.valor_meta),
        valor_guardado: parseFloat(form.valor_guardado) || 0,
      });
      setModalAberto(false);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarAporte(e) {
    e.preventDefault();
    if (!valorAporte) return;

    setSalvando(true);
    try {
      const novoValor = modalAporteAberto.valor_guardado + parseFloat(valorAporte);
      await api.atualizarMeta(modalAporteAberto.id, { valor_guardado: novoValor });
      setModalAporteAberto(null);
      setValorAporte('');
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    await api.excluirMeta(id);
    await carregar();
  }

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Metas Financeiras</h1>
          <p>Seus objetivos, um passo de cada vez</p>
        </div>
        <button className="botao botao-primario" onClick={abrirModal}>
          + Nova meta
        </button>
      </header>

      {carregando ? (
        <p className="pagina-vazio">Carregando...</p>
      ) : metas.length === 0 ? (
        <Card>
          <p className="pagina-vazio">
            Nenhuma meta cadastrada ainda. Que tal criar a primeira, como "Notebook novo" ou
            "Viagem de férias"?
          </p>
        </Card>
      ) : (
        <div className="metas-grade">
          {metas.map((meta) => (
            <Card key={meta.id} className="meta-card">
              <div className="meta-cabecalho">
                <span className="meta-nome">{meta.nome}</span>
                <button className="botao-fantasma" onClick={() => excluir(meta.id)}>✕</button>
              </div>

              <BarraConsumo percentualComprometido={meta.progresso} label="Progresso" />

              <div className="meta-valores">
                <span className="valor-monetario">{formatarMoeda(meta.valor_guardado)}</span>
                <span className="meta-valores-meta">de {formatarMoeda(meta.valor_meta)}</span>
              </div>

              {meta.data_alvo && (
                <span className="meta-data-alvo">Meta para {formatarData(meta.data_alvo)}</span>
              )}

              <button
                className="botao botao-secundario meta-botao-aporte"
                onClick={() => setModalAporteAberto(meta)}
              >
                + Guardar mais dinheiro
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Nova meta financeira" onFechar={() => setModalAberto(false)}>
        <form onSubmit={salvar}>
          <div className="form-campo">
            <label>Nome da meta</label>
            <input
              type="text"
              placeholder="Ex: Notebook novo, Viagem..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-linha">
            <div className="form-campo">
              <label>Valor da meta (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_meta}
                onChange={(e) => setForm({ ...form, valor_meta: e.target.value })}
                required
              />
            </div>
            <div className="form-campo">
              <label>Já guardado (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor_guardado}
                onChange={(e) => setForm({ ...form, valor_guardado: e.target.value })}
              />
            </div>
          </div>
          <div className="form-campo">
            <label>Data alvo (opcional)</label>
            <input
              type="date"
              value={form.data_alvo}
              onChange={(e) => setForm({ ...form, data_alvo: e.target.value })}
            />
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Criar meta'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={!!modalAporteAberto}
        titulo={`Guardar dinheiro: ${modalAporteAberto?.nome || ''}`}
        onFechar={() => setModalAporteAberto(null)}
      >
        <form onSubmit={confirmarAporte}>
          <div className="form-campo">
            <label>Quanto você quer guardar agora? (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valorAporte}
              onChange={(e) => setValorAporte(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalAporteAberto(null)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
