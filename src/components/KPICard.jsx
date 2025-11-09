const KPICard = ({ title, value, delta, deltaType, icon }) => {
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
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-sluGold">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-sluBlue mt-2">{value}</p>
          {delta !== undefined && (
            <p className={`text-sm mt-1 ${deltaColor}`}>
              {deltaIcon} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-4xl text-sluGold">{icon}</div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
