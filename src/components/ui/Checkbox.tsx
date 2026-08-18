import { Check } from 'lucide-react';

interface Props {
  checked: boolean;
  onChange: () => void;
  /** Rótulo para leitores de tela quando o texto visível fica fora do componente. */
  ariaLabel?: string;
}

/**
 * Caixa de seleção estilizada. O <input> nativo continua no DOM (só
 * visualmente escondido) para preservar navegação por teclado e leitores de
 * tela — o quadrado colorido é apenas a representação visual dele.
 */
export function Checkbox({ checked, onChange, ariaLabel }: Props) {
  return (
    <span className="relative inline-flex flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-card ${
          checked ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} className="text-primary-foreground" />}
      </span>
    </span>
  );
}
