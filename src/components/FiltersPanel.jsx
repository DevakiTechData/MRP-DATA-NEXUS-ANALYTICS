import { useState } from 'react';

const FiltersPanel = ({ dates, onFilterChange }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const uniqueYears = [...new Set(dates.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);
  const uniqueMonths = [...new Set(dates.map(d => d.month_name).filter(Boolean))].sort();

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    onFilterChange({ year, month: selectedMonth });
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    onFilterChange({ year: selectedYear, month });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold text-sluBlue mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sluBlue"
          >
            <option value="">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sluBlue"
          >
            <option value="">All Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
