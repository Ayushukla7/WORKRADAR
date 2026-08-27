import React from 'react';
import RiskScoreBadge from './RiskScoreBadge';
import { AlertTriangle, Lightbulb, ChevronRight, CheckCircle2, Clock, Activity } from 'lucide-react';

const RiskBreakdownCard = ({ task }) => {
  if (!task) return null;

  const { riskScore = 0, riskLevel = 'LOW', riskFactors = [], recommendedAction = '', deadline, progressPercentage = 0 } = task;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delay Risk Diagnostics</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{task.title}</h2>
        </div>
        <RiskScoreBadge score={riskScore} level={riskLevel} size="lg" />
      </div>

      {/* Velocity Progress Bar & Deadline Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-semibold">Schedule Progress Velocity</span>
            <span className="font-mono text-slate-900 font-bold">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskScore >= 65 ? 'bg-rose-500' : riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2 text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Target Deadline:</span>
          <span className="font-mono text-slate-900 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
            {deadline ? new Date(deadline).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Why is this task at risk? (Diagnostic Factors) */}
      <div className="mb-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Delay Risk Drivers ({riskFactors.length})</span>
        </h3>
        <div className="space-y-2">
          {riskFactors && riskFactors.length > 0 ? (
            riskFactors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition"
              >
                <div className="p-1 bg-rose-100 rounded text-rose-700 mt-0.5 shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                <span className="leading-relaxed font-medium">{factor}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center space-x-2.5 text-xs text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Schedule velocity is on track with zero active blocker flags.</span>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Manager Recommendation */}
      {recommendedAction && (
        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1.5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Recommended Action for Manager</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-medium pl-6">
            {recommendedAction}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskBreakdownCard;
