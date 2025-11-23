import { useState } from 'react';

/**
 * InfoTooltip Component
 * Displays an info icon that shows explanatory tooltip on hover
 * @param {string} content - The tooltip content to display
 * @param {string} title - Optional title for the tooltip
 */
const InfoTooltip = ({ content, title, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Show explanation"
      >
        ?
      </button>
      
      {showTooltip && (
        <div
          className={`absolute z-50 ${positionClasses[position]} min-w-[280px] max-w-[320px] bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 border border-slate-700 pointer-events-none`}
        >
          {title && (
            <div className="font-bold text-sluGold mb-2 pb-2 border-b border-slate-700">
              {title}
            </div>
          )}
          <div className="text-blue-100 leading-relaxed whitespace-normal">
            {content}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-r-transparent border-b-transparent border-l-transparent'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-r-transparent border-t-transparent border-l-transparent'
                : position === 'right'
                ? 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-t-transparent border-b-transparent border-l-transparent'
                : 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-t-transparent border-b-transparent border-r-transparent'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;

