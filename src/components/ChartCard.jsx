const ChartCard = ({
  title,
  subtitle,
  children,
  className = "",
  isTable = false,
  fullHeight = false,
  contentClassName = "",
}) => {
  const baseHeightClass = (() => {
    if (isTable) {
      return fullHeight ? "h-full" : "min-h-[400px]";
    }
    if (fullHeight) {
      return "h-full min-h-[560px]";
    }
    return "min-h-[560px]";
  })();

  const overflowClass = isTable ? "overflow-y-auto" : "";
  const containerClassNames = [baseHeightClass, overflowClass, "w-full", contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`bg-gradient-to-br from-white via-blue-50/50 to-blue-50/30 rounded-xl shadow-md border border-blue-300/60 p-6 ${className}`}>
      <div className="mb-4 pb-3 border-b border-blue-300/40">
        <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-600 mt-1 leading-relaxed">{subtitle}</p> : null}
      </div>
      <div className={containerClassNames}>{children}</div>
    </div>
  );
};

export default ChartCard;
