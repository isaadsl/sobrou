import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatarMoeda, formatarDataExtensa, CATEGORIAS, PRIORIDADES } from '../utils/formatadores';
import Card from '../components/Card';
import Modal from '../components/Modal';
import SeloPrioridade from '../components/SeloPrioridade';
import BarraConsumo from '../components/BarraConsumo';
import '../styles/formularios.css';
import './ProximoSalario.css';

const FORM_PLANEJAMENTO_VAZIO = { valor_previsto: '', data_prevista: '', observacoes: '' };
const FORM_ITEM_VAZIO = { nome: '', valor: '', categoria: 'Outros', prioridade: 'media' };

export default function ProximoSalario() {
  const [planejamentos, setPlanejamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalItemAberto, setModalItemAberto] = useState(null); 
  const [formPlanejamento, setFormPlanejamento] = useState(FORM_PLANEJAMENTO_VAZIO);
  const [formItem, setFormItem] = useState(FORM_ITEM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await api.listarPlanejamentos();
    setPlanejamentos(dados);
    setCarregando(false);
  }

  async function criarPlanejamento(e) {
    e.preventDefault();
    if (!formPlanejamento.valor_previsto || !formPlanejamento.data_prevista) return;

    setSalvando(true);
    try {
      await api.criarPlanejamento({
        ...formPlanejamento,
        valor_previsto: parseFloat(formPlanejamento.valor_previsto),
      });
      setModalNovoAberto(false);
      setFormPlanejamento(FORM_PLANEJAMENTO_VAZIO);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarItem(e) {
    e.preventDefault();
    if (!formItem.nome || !formItem.valor) return;

    setSalvando(true);
    try {
      await api.adicionarItemPlanejamento(modalItemAberto, {
        ...formItem,
        valor: parseFloat(formItem.valor),
      });
      setModalItemAberto(null);
      setFormItem(FORM_ITEM_VAZIO);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function removerItem(planejamentoId, itemId) {
    await api.removerItemPlanejamento(planejamentoId, itemId);
    await carregar();
  }

  async function excluirPlanejamento(id) {
    await api.excluirPlanejamento(id);
    await carregar();
  }

  return (
    <div className="pagina-lista">
      <header className="pagina-cabecalho">
        <div>
          <h1>Planejamento do Próximo Salário</h1>
          <p>Simule seus gastos antes mesmo de receber o dinheiro</p>
        </div>
        <button className="botao botao-primario" onClick={() => setModalNovoAberto(true)}>
          + Simular novo recebimento
        </button>
      </header>

      {carregando ? (
        <p className="pagina-vazio">Carregando...</p>
      ) : planejamentos.length === 0 ? (
        <Card>
          <p className="pagina-vazio">
            Você ainda não tem nenhuma simulação. Que tal começar? Diga quanto vai receber e quando,
            depois adicione as contas que já sabe que vai ter.
          </p>
        </Card>
      ) : (
        <div className="simulacoes-grade">
          {planejamentos.map((p) => (
            <Card key={p.id} className="simulacao-card">
              <div className="simulacao-cabecalho">
                <div>
                  <span className="simulacao-valor-previsto valor-monetario">
                    {formatarMoeda(p.valor_previsto)}
                  </span>
                  <span className="simulacao-data">previsto para {formatarDataExtensa(p.data_prevista)}</span>
                </div>
                <button className="botao-fantasma" onClick={() => excluirPlanejamento(p.id)}>
                  ✕
                </button>
              </div>

              <BarraConsumo
                percentualComprometido={p.percentual_comprometido}
                label="Já planejado"
              />

              <div className="simulacao-resultado">
                <div>
                  <span>Total planejado</span>
                  <strong className="valor-monetario">{formatarMoeda(p.total_planejado)}</strong>
                </div>
                <div>
                  <span>Sobrará</span>
                  <strong className={`valor-monetario ${p.restante < 0 ? 'cor-negativa' : 'cor-positiva'}`}>
                    {formatarMoeda(p.restante)}
                  </strong>
                </div>
              </div>

              {p.itens.length > 0 && (
                <ul className="simulacao-itens">
                  {p.itens.map((item) => (
                    <li key={item.id}>
                      <div className="simulacao-item-info">
                        <span>{item.nome}</span>
                        <SeloPrioridade prioridade={item.prioridade} />
                      </div>
                      <div className="simulacao-item-acoes">
                        <span className="valor-monetario">{formatarMoeda(item.valor)}</span>
                        <button className="botao-fantasma" onClick={() => removerItem(p.id, item.id)}>
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="botao botao-secundario simulacao-botao-item"
                onClick={() => {
                  setFormItem(FORM_ITEM_VAZIO);
                  setModalItemAberto(p.id);
                }}
              >
                + Adicionar conta prevista
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        aberto={modalNovoAberto}
        titulo="Simular novo recebimento"
        onFechar={() => setModalNovoAberto(false)}
      >
        <form onSubmit={criarPlanejamento}>
          <div className="form-campo">
            <label>Quanto você vai receber? (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 500,00"
              value={formPlanejamento.valor_previsto}
              onChange={(e) => setFormPlanejamento({ ...formPlanejamento, valor_previsto: e.target.value })}
              required
            />
          </div>
          <div className="form-campo">
            <label>Quando?</label>
            <input
              type="date"
              value={formPlanejamento.data_prevista}
              onChange={(e) => setFormPlanejamento({ ...formPlanejamento, data_prevista: e.target.value })}
              required
            />
          </div>
          <div className="form-campo">
            <label>Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: segunda parcela do salário"
              value={formPlanejamento.observacoes}
              onChange={(e) => setFormPlanejamento({ ...formPlanejamento, observacoes: e.target.value })}
            />
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalNovoAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Começar simulação'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={!!modalItemAberto}
        titulo="Adicionar conta prevista"
        onFechar={() => setModalItemAberto(null)}
      >
        <form onSubmit={adicionarItem}>
          <div className="form-campo">
            <label>Nome da conta</label>
            <input
              type="text"
              placeholder="Ex: Internet, Mercado..."
              value={formItem.nome}
              onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })}
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
                value={formItem.valor}
                onChange={(e) => setFormItem({ ...formItem, valor: e.target.value })}
                required
              />
            </div>
            <div className="form-campo">
              <label>Categoria</label>
              <select value={formItem.categoria} onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-campo">
            <label>Prioridade</label>
            <select value={formItem.prioridade} onChange={(e) => setFormItem({ ...formItem, prioridade: e.target.value })}>
              {PRIORIDADES.map((p) => (
                <option key={p.valor} value={p.valor}>{p.emoji} {p.rotulo}</option>
              ))}
            </select>
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalItemAberto(null)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario" disabled={salvando}>
              {salvando ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
