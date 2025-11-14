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
      return fullHeight ? "h-full" : "max-h-[320px]";
    }
    if (fullHeight) {
      return "h-full min-h-[360px]";
    }
    return "h-[320px]";
  })();

  const overflowClass = isTable ? "overflow-y-auto" : "";
  const containerClassNames = [baseHeightClass, overflowClass, "w-full", contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-100 p-5 ${className}`}>
      <div className="mb-3 pb-2 border-b border-slate-200">
        <h3 className="text-base font-semibold text-sluBlue tracking-tight">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p> : null}
      </div>
      <div className={containerClassNames}>{children}</div>
    </div>
  );
};

export default ChartCard;
