import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon?: ReactNode;
  iconBg?: string;
}

export function StatsCard({ label, value, sub, subColor = 'text-gray-500', icon, iconBg = 'bg-primary/20' }: Props) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
      </div>
      {icon && (
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  );
}
