import { useState } from 'react';

const KPICard = ({ title, value, delta, deltaType, icon, tooltip, calculation }) => {
  const [showCalculation, setShowCalculation] = useState(false);
  
  const deltaColor = deltaType === 'positive' 
    ? 'text-green-600' 
    : deltaType === 'negative' 
    ? 'text-red-600' 
    : 'text-gray-600';
  
  const deltaIcon = deltaType === 'positive' 
    ? '↑' 
    : deltaType === 'negative' 
    ? '↓' 
    : '';

  return (
    <div 
      className="relative bg-gradient-to-br from-sluBlue via-blue-800 to-blue-900 rounded-lg shadow-sm border border-blue-700/60 p-5 hover:shadow-md hover:border-blue-500 hover:from-blue-700 hover:to-blue-800 transition-all"
      onMouseEnter={() => calculation && setShowCalculation(true)}
      onMouseLeave={() => setShowCalculation(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {tooltip && (
            <p className="text-xs text-blue-100 mt-1 line-clamp-2">{tooltip}</p>
          )}
          {delta !== undefined && (
            <p className={`text-xs mt-1 ${deltaColor}`}>
              {deltaIcon} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-3xl text-sluGold ml-4 opacity-90">{icon}</div>
        )}
      </div>
      
      {/* Calculation Tooltip on Hover */}
      {calculation && showCalculation && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-900 text-white rounded-lg shadow-xl p-4 border border-slate-700 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-slate-900 border-r border-b border-slate-700"></div>
          <p className="text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wide">📊 Calculation & Data Source</p>
          {calculation.dataSources && (
            <div className="mb-2">
              <p className="text-xs font-medium text-slate-300 mb-1">Data Sources:</p>
              <div className="flex flex-wrap gap-1">
                {calculation.dataSources.map((source, idx) => (
                  <code key={idx} className="text-xs bg-slate-800 text-blue-300 px-2 py-0.5 rounded">{source}</code>
                ))}
              </div>
            </div>
          )}
          {calculation.method && (
            <div className="mb-2">
              <p className="text-xs font-medium text-slate-300 mb-1">Calculation Method:</p>
              <p className="text-xs text-slate-200 leading-relaxed">{calculation.method}</p>
            </div>
          )}
          {calculation.formula && (
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Formula:</p>
              <p className="text-xs text-slate-200 font-mono leading-relaxed break-words">{calculation.formula}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
