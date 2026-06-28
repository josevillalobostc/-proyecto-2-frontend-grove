import type { ConfidenceBadge } from '../../types';

interface ConfidenceBadgeProps {
  badge: ConfidenceBadge;
}

const BADGE_CONFIG: Record<NonNullable<ConfidenceBadge>, { label: string; className: string }> = {
  NOT_STARTED: { label: 'NOT STARTED', className: 'bg-gray-600 text-gray-200' },
  LEARNING: { label: 'LEARNING', className: 'bg-blue-600 text-blue-100' },
  REVIEWING: { label: 'REVIEWING', className: 'bg-yellow-600 text-yellow-100' },
  HIGH: { label: 'HIGH', className: 'bg-orange-500 text-orange-100' },
  MASTERED: { label: 'MASTERED', className: 'bg-grove-green text-grove-dark font-bold' },
};

export function ConfidenceLevelBadge({ badge }: ConfidenceBadgeProps) {
  if (!badge) return null;
  const config = BADGE_CONFIG[badge];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}

interface TagBadgeProps {
  name: string;
  color?: string;
  onClick?: () => void;
}

export function TagBadge({ name, color, onClick }: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ backgroundColor: color ? `${color}33` : 'transparent', color: color || '#4ade80', border: `1px solid ${color || '#4ade80'}` }}
    >
      {name}
    </span>
  );
}
