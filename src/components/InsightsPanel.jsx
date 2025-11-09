const InsightsPanel = ({ insights, title = "Analysis Insights" }) => {
  return (
    <div className="bg-gradient-to-r from-sluBlue to-blue-800 rounded-lg shadow-lg p-6 mb-6 text-white">
      <h3 className="text-2xl font-bold mb-4 border-b-2 border-sluGold pb-2">
        {title}
      </h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start">
              <span className="text-sluGold text-xl mr-3">•</span>
              <div>
                <h4 className="font-semibold text-lg mb-1">{insight.title}</h4>
                <p className="text-gray-100">{insight.description}</p>
                {insight.recommendation && (
                  <p className="text-sluGold mt-2 italic">
                    💡 Recommendation: {insight.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;
