/**
 * InsightCard Component
 * Displays a small insight tile with label and value
 */
const InsightCard = ({ label, value, subtitle }) => {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/60 to-blue-50/40 rounded-lg border border-blue-300/60 shadow-md p-4 hover:shadow-lg hover:border-sluBlue/70 hover:from-blue-100/80 hover:to-blue-50/60 transition-all">
      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-lg font-bold text-slate-800 mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-600 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default InsightCard;

