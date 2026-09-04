import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { GRANDES_AREAS, SUB_AREAS } from '../../data/areas';
import { calcularAproveitamento, calcularProximaRevisao } from '../../utils/algoritmoRevisao';
import { today } from '../../utils/dateUtils';
import type { GrandeArea, TipoAtividade } from '../../types';

interface Props { open: boolean; onClose: () => void; defaultTipo?: TipoAtividade; }

export function AddRevisaoModal({ open, onClose, defaultTipo }: Props) {
  const { addRevisao, configAlgoritmo } = useStore();
  const [tipo, setTipo] = useState<TipoAtividade>(defaultTipo ?? 'Questoes');
  const [area, setArea] = useState<GrandeArea>('Clínica Médica');
  const [subArea, setSubArea] = useState('');
  const [data, setData] = useState(today());
  const [tempo, setTempo] = useState('');
  const [feitas, setFeitas] = useState('');
  const [acertadas, setAcertadas] = useState('');
  const [inteligente, setInteligente] = useState(true);

  const aproveitamento = calcularAproveitamento(Number(feitas) || 0, Number(acertadas) || 0);
  const proxima = inteligente
    ? calcularProximaRevisao(aproveitamento, data, configAlgoritmo)
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const f = Number(feitas) || 0;
    const a = Number(acertadas) || 0;
    const ap = calcularAproveitamento(f, a);

    addRevisao({
      tipo, grandeArea: area,
      subArea: subArea || (tipo === 'Flashcards' ? 'Sessão de Flashcards' : 'Geral'),
      dataRevisao: data, tempoEstudo: Number(tempo) || 0,
      questoesFeitas: f, questoesAcertadas: a, aproveitamento: ap,
      status: 'Concluída', gerarRevisaoInteligente: inteligente,
      proximaRevisao: inteligente ? calcularProximaRevisao(ap, data, configAlgoritmo) : null,
    });

    if (inteligente) {
      addRevisao({
        tipo, grandeArea: area,
        subArea: subArea || (tipo === 'Flashcards' ? 'Sessão de Flashcards' : 'Geral'),
        dataRevisao: calcularProximaRevisao(ap, data, configAlgoritmo),
        tempoEstudo: 0, questoesFeitas: 0, questoesAcertadas: 0,
        aproveitamento: 0, status: 'Pendente', gerarRevisaoInteligente: true, proximaRevisao: null,
      });
    }

    onClose();
    setFeitas(''); setAcertadas(''); setTempo('');
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Nova Revisão">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tipo de Atividade</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoAtividade)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            >
              <option value="Questoes">Questões</option>
              <option value="Flashcards">Flashcards</option>
              <option value="Aula">Aula</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Grande Área</label>
            <select
              value={area}
              onChange={e => { setArea(e.target.value as GrandeArea); setSubArea(''); }}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            >
              {GRANDES_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Aula / Sub-área</label>
            <input
              list={`subareas-${area}`}
              value={subArea}
              onChange={e => setSubArea(e.target.value)}
              placeholder="Ex: Esquizofrenia"
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
            <datalist id={`subareas-${area}`}>
              {SUB_AREAS[area]?.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="flex items-end">
            <label
              className={`flex items-center gap-2.5 cursor-pointer select-none w-full bg-muted border rounded-lg px-3 py-2.5 transition-colors ${
                inteligente ? 'border-primary bg-primary/10' : 'border-card-border'
              }`}
            >
              <div
                onClick={() => setInteligente(!inteligente)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                  inteligente ? 'bg-primary' : 'bg-gray-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${inteligente ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-gray-300">Revisão inteligente</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Data da Revisão</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tempo de Estudo (min)</label>
            <input
              type="number" min="0"
              value={tempo}
              onChange={e => setTempo(e.target.value)}
              placeholder="Ex: 45"
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-300">Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                {tipo === 'Flashcards' ? 'Cards Vistos' : 'Questões Feitas'}
              </label>
              <div className="flex">
                <input
                  type="number" min="0"
                  value={feitas}
                  onChange={e => setFeitas(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted border border-card-border rounded-l-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
                <span className="bg-muted border border-l-0 border-card-border rounded-r-lg px-3 py-2 text-xs text-gray-500">TOTAL</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                {tipo === 'Flashcards' ? 'Cards Acertados' : 'Questões Acertadas'}
              </label>
              <div className="flex">
                <input
                  type="number" min="0"
                  value={acertadas}
                  onChange={e => setAcertadas(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted border border-card-border rounded-l-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
                <span className="bg-muted border border-l-0 border-card-border rounded-r-lg px-3 py-2 text-xs text-green-500">ACERTOS</span>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Aproveitamento</p>
              <p className={`text-2xl font-bold ${aproveitamento >= 70 ? 'text-green-400' : aproveitamento >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {Number(feitas) > 0 ? `${aproveitamento}%` : '0%'}
              </p>
              {proxima && Number(feitas) > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">Próxima revisão: <span className="text-primary">{proxima}</span></p>
              )}
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                Number(feitas) === 0 ? 'bg-gray-600/30 text-gray-400' :
                aproveitamento >= 70 ? 'bg-green-500/20 text-green-400' :
                aproveitamento >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {Number(feitas) === 0 ? 'PENDENTE' : aproveitamento >= 70 ? 'BOM' : aproveitamento >= 50 ? 'ATENÇÃO' : 'CRÍTICO'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-card-border text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
          >
            Salvar Revisão
          </button>
        </div>
      </form>
    </Modal>
  );
}
