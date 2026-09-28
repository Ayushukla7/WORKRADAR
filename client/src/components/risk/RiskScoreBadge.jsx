import React from 'react';

const RiskScoreBadge = ({ score = 0, level = 'LOW', size = 'md' }) => {
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = 'Low Risk';

  if (score >= 85 || level === 'CRITICAL') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Critical';
  } else if (score >= 65 || level === 'HIGH') {
    badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
    label = 'High Risk';
  } else if (score >= 35 || level === 'MEDIUM') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Medium';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs',
  }[size] || 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-lg border font-semibold ${badgeStyle} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
      <span className="font-mono text-[11px] opacity-75 font-bold">({score}%)</span>
    </span>
  );
};

export default RiskScoreBadge;
