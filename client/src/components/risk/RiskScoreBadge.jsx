import React from 'react';

const RiskScoreBadge = ({ score = 0, level = 'LOW', size = 'md' }) => {
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotClass = 'bg-emerald-500';
  let label = 'Low Risk';

  if (score >= 85 || level === 'CRITICAL') {
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-500';
    label = 'Critical Risk';
  } else if (score >= 65 || level === 'HIGH') {
    badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
    dotClass = 'bg-orange-500';
    label = 'High Risk';
  } else if (score >= 35 || level === 'MEDIUM') {
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    dotClass = 'bg-amber-500';
    label = 'Medium Risk';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium shrink-0 whitespace-nowrap ${badgeClass} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />
      <span>{label}</span>
      <span className="font-mono text-[11px] opacity-75 font-semibold">({score}%)</span>
    </span>
  );
};

export default RiskScoreBadge;
