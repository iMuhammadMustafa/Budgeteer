import React from 'react';
import { getIntervalDisplayText, getIntervalShortText } from '@/src/utils/interval-calculation';

interface IntervalDisplayProps {
  intervalMonths: number;
  short?: boolean;
  className?: string;
}

/**
 * Component to display custom monthly intervals in a user-friendly format
 */
export const IntervalDisplay: React.FC<IntervalDisplayProps> = ({
  intervalMonths,
  short = false,
  className = ''
}) => {
  const displayText = short 
    ? getIntervalShortText(intervalMonths)
    : getIntervalDisplayText(intervalMonths);

  return (
    <span className={className} title={`Every ${intervalMonths} month${intervalMonths > 1 ? 's' : ''}`}>
      {displayText}
    </span>
  );
};

interface IntervalSelectorProps {
  value: number;
  onChange: (intervalMonths: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Component for selecting custom monthly intervals
 */
export const IntervalSelector: React.FC<IntervalSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const commonIntervals = [
    { value: 1, label: 'Monthly' },
    { value: 2, label: 'Every 2 months' },
    { value: 3, label: 'Quarterly' },
    { value: 4, label: 'Every 4 months' },
    { value: 6, label: 'Semi-annually' },
    { value: 12, label: 'Annually' },
    { value: 24, label: 'Every 2 years' }
  ];

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleCustomInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue) && newValue >= 1 && newValue <= 24) {
      onChange(newValue);
    }
  };

  const isCustomInterval = !commonIntervals.some(interval => interval.value === value);

  return (
    <div className={`interval-selector ${className}`}>
      <select
        value={isCustomInterval ? 'custom' : value}
        onChange={handleSelectChange}
        disabled={disabled}
        className="interval-select"
      >
        {commonIntervals.map(interval => (
          <option key={interval.value} value={interval.value}>
            {interval.label}
          </option>
        ))}
        <option value="custom">Custom...</option>
      </select>
      
      {isCustomInterval && (
        <div className="custom-interval-input">
          <label>
            Every
            <input
              type="number"
              min="1"
              max="24"
              value={value}
              onChange={handleCustomInput}
              disabled={disabled}
              className="custom-interval-number"
            />
            months
          </label>
        </div>
      )}
    </div>
  );
};

export default IntervalDisplay;