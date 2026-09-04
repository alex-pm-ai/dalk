import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DEFAULT_CONFIG } from '../utils/algoritmoRevisao';
import type { ConfigAlgoritmo } from '../types';

export function ConfigRevisao() {
  const { configAlgoritmo, setConfigAlgoritmo } = useStore();
  const [config, setConfig] = useState<ConfigAlgoritmo>(configAlgoritmo);
  const [saved, setSaved] = useState(false);

  function updateDias(idx: number, dias: number) {
    setConfig(c => ({
      faixas: c.faixas.map((f, i) => i === idx ? { ...f, dias } : f),
    }));
  }

  function handleSave() {
    setConfigAlgoritmo(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setConfig(DEFAULT_CONFIG);
  }

  const labelColors = {
    'Atenção':   'bg-red-500/20 text-red-400 border-red-500/30',
    'Bom':       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Excelente': 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Personalizar Algoritmo de Revisão</h2>
          <p className="text-sm text-gray-500 mt-0.5">Ajuste os intervalos de tempo para cada faixa de acerto.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm border border-card-border px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={14} />
            Restaurar Padrão
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <Save size={14} />
            {saved ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {config.faixas.map((faixa, idx) => (
          <div key={idx} className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">
                Acerto entre {faixa.min}% e {faixa.max}%
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${labelColors[faixa.label]}`}>
                {faixa.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 flex-shrink-0">Próxima revisão em:</span>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={faixa.dias}
                  onChange={e => updateDias(idx, Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-muted border border-card-border rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-gray-500">DIAS</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-3">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((faixa.dias / 45) * 100, 100)}%`,
                    backgroundColor: faixa.label === 'Excelente' ? '#22c55e' : faixa.label === 'Bom' ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                {faixa.dias === 1 ? 'Revisão imediata' : `~${Math.round(faixa.dias / 7)} semana(s)`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-3">Como funciona o algoritmo</h3>
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-medium text-red-400">Atenção (0% a 59%)</span>
            </div>
            <p>Conteúdo com baixo aproveitamento é revisado rapidamente — em poucos dias — para reforçar a memória antes que se perca.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="font-medium text-yellow-400">Bom (60% a 79%)</span>
            </div>
            <p>Conteúdo com aproveitamento moderado tem intervalos médios de revisão, consolidando o aprendizado progressivamente.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-medium text-green-400">Excelente (80% a 100%)</span>
            </div>
            <p>Conteúdo bem dominado fica mais tempo sem revisão, liberando tempo para focar nas áreas que precisam de atenção.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
