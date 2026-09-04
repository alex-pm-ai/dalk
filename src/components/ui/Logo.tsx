import { Zap } from 'lucide-react';

const SIZES = {
  sm: { box: 'w-7 h-7', icon: 14, text: 'text-base' },
  md: { box: 'w-8 h-8', icon: 16, text: 'text-xl' },
  lg: { box: 'w-9 h-9', icon: 18, text: 'text-2xl' },
} as const;

export function Logo({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <div className="flex items-center gap-2">
      <div className={`${s.box} rounded-lg bg-primary flex items-center justify-center`}>
        <Zap size={s.icon} className="text-primary-foreground" />
      </div>
      <span className={`font-bold text-foreground ${s.text} tracking-wide font-heading`}>
        Mindfast
      </span>
    </div>
  );
}
