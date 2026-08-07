import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { today } from '../../utils/dateUtils';
import type { GrandeArea } from '../../types';

const AREAS_SIMULADO: GrandeArea[] = [
  'Clínica Médica', 'Cirurgia Geral',
  'Ginecologia e Obstetrícia', 'Pediatria', 'Preventiva',
];

interface Props { open: boolean; onClose: () => void; }

export function AddSimuladoModal({ open, onClose }: Props) {
  const { addSimulado } = useStore();
  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(today());
  const [tempo, setTempo] = useState('150');
  const [total, setTotal] = useState('100');
  const [acertos, setAcertos] = useState('');
  const [porArea, setPorArea] = useState<Record<string, { acertos: string; total: string }>>(
    Object.fromEntries(AREAS_SIMULADO.map(a => [a, { acertos: '', total: '20' }]))
  );

  const nota = Number(total) > 0 ? Math.round((Number(acertos) / Number(total)) * 100) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addSimulado({
      titulo: titulo || 'Simulado',
      ano,
      dataRealizacao: data,
      tempoGasto: Number(tempo) || 0,
      questoesTotal: Number(total) || 0,
      questoesAcertadas: Number(acertos) || 0,
      nota,
      detalhePorArea: AREAS_SIMULADO.map(a => ({
        area: a,
        acertos: Number(porArea[a]?.acertos) || 0,
        total: Number(porArea[a]?.total) || 0,
      })).filter(d => d.total > 0),
    });
    onClose();
    setTitulo(''); setAcertos('');
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Simulado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Título</label>
            <input
              value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: ENAMED"
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Ano</label>
            <input
              value={ano} onChange={e => setAno(e.target.value)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Data</label>
            <input
              type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tempo (min)</label>
            <input
              type="number" value={tempo} onChange={e => setTempo(e.target.value)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Total de Questões</label>
            <input
              type="number" value={total} onChange={e => setTotal(e.target.value)}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Total de Acertos</label>
          <div className="flex gap-3 items-center">
            <input
              type="number" value={acertos} onChange={e => setAcertos(e.target.value)}
              placeholder="0"
              className="w-40 bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
            <span className={`text-lg font-bold ${nota >= 70 ? 'text-green-400' : nota >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {nota}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Detalhe por Área (opcional)</p>
          <div className="space-y-2">
            {AREAS_SIMULADO.map(a => (
              <div key={a} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-44 truncate">{a}</span>
                <input
                  type="number"
                  placeholder="Acertos"
                  value={porArea[a]?.acertos}
                  onChange={e => setPorArea(p => ({ ...p, [a]: { ...p[a], acertos: e.target.value } }))}
                  className="w-24 bg-muted border border-card-border rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
                <span className="text-gray-600 text-xs">/</span>
                <input
                  type="number"
                  placeholder="Total"
                  value={porArea[a]?.total}
                  onChange={e => setPorArea(p => ({ ...p, [a]: { ...p[a], total: e.target.value } }))}
                  className="w-24 bg-muted border border-card-border rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-card-border text-gray-300 text-sm hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors">
            Salvar Simulado
          </button>
        </div>
      </form>
    </Modal>
  );
}
