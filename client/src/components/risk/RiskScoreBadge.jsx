import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

const RiskScoreBadge = ({ score = 0, level = 'LOW', showIcon = true, size = 'md' }) => {
  let bgColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;
  let label = 'LOW RISK';

  if (score >= 85 || level === 'CRITICAL') {
    bgColor = 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse';
    Icon = ShieldAlert;
    label = 'CRITICAL RISK';
  } else if (score >= 65 || level === 'HIGH') {
    bgColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    Icon = AlertTriangle;
    label = 'HIGH RISK';
  } else if (score >= 35 || level === 'MEDIUM') {
    bgColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    Icon = AlertCircle;
    label = 'MEDIUM RISK';
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs font-black',
    lg: 'px-4 py-1.5 text-xs font-black tracking-wide',
  }[size] || 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border ${bgColor} ${sizeClasses}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
      <span className="font-mono bg-black px-2 py-0.2 rounded-full border border-neutral-700 text-[10px] font-black text-lime-400">
        {score}/100
      </span>
    </span>
  );
};

export default RiskScoreBadge;
