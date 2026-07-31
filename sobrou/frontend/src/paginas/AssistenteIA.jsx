import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { perguntarAoAssistente, simularCompra } from '../services/assistenteIA';
import { formatarMoeda } from '../utils/formatadores';
import Modal from '../components/Modal';
import '../styles/formularios.css';
import './AssistenteIA.css';

const SUGESTOES = [
  'Quanto eu gastei este mês?',
  'Como posso investir com o meu salário?',
  'Como posso economizar mais dinheiro?',
  'Qual categoria está consumindo mais dinheiro?',
];

export default function AssistenteIA() {
  const [mensagens, setMensagens] = useState([]);
  const [pergunta, setPergunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [modalSimulacaoAberto, setModalSimulacaoAberto] = useState(false);
  const [simulacao, setSimulacao] = useState({ item: '', valor: '' });
  const fimDaListaRef = useRef(null);

  useEffect(() => {
    carregarHistorico();
  }, []);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function carregarHistorico() {
    setCarregandoHistorico(true);
    try {
      const conversas = await api.listarConversasIA();
      setMensagens(
        conversas.map((c) => ({ pergunta: c.pergunta, resposta: c.resposta, id: c.id }))
      );
    } catch {
    
    } finally {
      setCarregandoHistorico(false);
    }
  }

  async function enviarPergunta(textoPergunta) {
    const texto = (textoPergunta || pergunta).trim();
    if (!texto || enviando) return;

    const historicoNoMomento = mensagens.filter((m) => m.resposta);
    setPergunta('');
    setEnviando(true);

    const novaEntrada = { pergunta: texto, resposta: null, carregando: true };
    setMensagens((atual) => [...atual, novaEntrada]);

    try {
      const resposta = await perguntarAoAssistente(texto, historicoNoMomento);
      setMensagens((atual) =>
        atual.map((m) => (m === novaEntrada ? { pergunta: texto, resposta } : m))
      );
      await api.salvarConversaIA({ pergunta: texto, resposta, contexto_usado: null });
    } catch (erro) {
      setMensagens((atual) =>
        atual.map((m) =>
          m === novaEntrada ? { pergunta: texto, resposta: null, erro: erro.message } : m
        )
      );
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarSimulacao(e) {
    e.preventDefault();
    if (!simulacao.item || !simulacao.valor) return;

    setModalSimulacaoAberto(false);
    setEnviando(true);

    const textoPergunta = `Simular compra: ${simulacao.item} (${formatarMoeda(parseFloat(simulacao.valor))})`;
    const novaEntrada = { pergunta: textoPergunta, resposta: null, carregando: true };
    setMensagens((atual) => [...atual, novaEntrada]);

    try {
      const resposta = await simularCompra(simulacao.item, parseFloat(simulacao.valor));
      setMensagens((atual) =>
        atual.map((m) => (m === novaEntrada ? { pergunta: textoPergunta, resposta } : m))
      );
      await api.salvarConversaIA({ pergunta: textoPergunta, resposta, contexto_usado: null });
    } catch (erro) {
      setMensagens((atual) =>
        atual.map((m) =>
          m === novaEntrada ? { pergunta: textoPergunta, resposta: null, erro: erro.message } : m
        )
      );
    } finally {
      setEnviando(false);
      setSimulacao({ item: '', valor: '' });
    }
  }

  return (
    <div className="assistente-pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Assistente Financeiro IA</h1>
          <p>Pergunte qualquer coisa sobre suas finanças, com base nos seus dados reais</p>
        </div>
        <button className="botao botao-secundario" onClick={() => setModalSimulacaoAberto(true)}>
           Simular compra
        </button>
      </header>

      <div className="assistente-chat">
        {carregandoHistorico ? (
          <p className="pagina-vazio">Carregando histórico...</p>
        ) : mensagens.length === 0 ? (
          <div className="assistente-boas-vindas">
            <p>Oi! Sou o assistente financeiro do Sobrou. Posso analisar seus dados e responder
              perguntas sobre seu dinheiro. Experimente perguntar:</p>
            <div className="assistente-sugestoes">
              {SUGESTOES.map((s) => (
                <button key={s} className="assistente-sugestao" onClick={() => enviarPergunta(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((m, i) => (
            <div key={m.id || i} className="assistente-troca">
              <div className="assistente-balao assistente-balao-usuario">{m.pergunta}</div>
              {m.carregando ? (
                <div className="assistente-balao assistente-balao-ia assistente-digitando">
                  <span /><span /><span />
                </div>
              ) : m.erro ? (
                <div className="assistente-balao assistente-balao-erro">{m.erro}</div>
              ) : (
                <div className="assistente-balao assistente-balao-ia">{m.resposta}</div>
              )}
            </div>
          ))
        )}
        <div ref={fimDaListaRef} />
      </div>

      <form
        className="assistente-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          enviarPergunta();
        }}
      >
        <input
          type="text"
          placeholder="Pergunte sobre suas finanças..."
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          disabled={enviando}
        />
        <button type="submit" className="botao botao-primario" disabled={enviando || !pergunta.trim()}>
          Enviar
        </button>
      </form>

      <Modal
        aberto={modalSimulacaoAberto}
        titulo="Simular compra"
        onFechar={() => setModalSimulacaoAberto(false)}
      >
        <form onSubmit={confirmarSimulacao}>
          <div className="form-campo">
            <label>O que você quer comprar?</label>
            <input
              type="text"
              placeholder="Ex: Notebook, celular, viagem..."
              value={simulacao.item}
              onChange={(e) => setSimulacao({ ...simulacao, item: e.target.value })}
              required
            />
          </div>
          <div className="form-campo">
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={simulacao.valor}
              onChange={(e) => setSimulacao({ ...simulacao, valor: e.target.value })}
              required
            />
          </div>
          <div className="form-acoes">
            <button type="button" className="botao botao-secundario" onClick={() => setModalSimulacaoAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario">
              Simular
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}