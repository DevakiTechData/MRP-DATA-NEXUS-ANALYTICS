const ChartCard = ({ title, children, className = "", isTable = false, fullHeight = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-sluBlue mb-4 border-b-2 border-sluGold pb-2">
        {title}
      </h3>
      <div className={isTable ? "min-h-64 max-h-96" : fullHeight ? "h-full min-h-96" : "h-64"}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
