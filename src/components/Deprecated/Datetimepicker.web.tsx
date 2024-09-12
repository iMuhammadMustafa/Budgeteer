import { useState } from "react";
import Icon from "../../lib/IonIcons";

export default function DateTimePicker() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      options.push(`${i.toString().padStart(2, "0")}:00`);
    }
    return options;
  };

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <div className="relative">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full sm:w-[240px] px-3 py-2 border rounded-md text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Icon name="Calendar" className="h-5 w-5 text-gray-400" />
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          {date ? (
            <span className="text-sm text-gray-500">{formatDate(date)}</span>
          ) : (
            <span className="text-sm text-gray-400">Pick a date</span>
          )}
        </div>
      </div>

      <div className="relative">
        <select
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full sm:w-[140px] px-3 py-2 border rounded-md text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
        >
          <option value="">Pick a time</option>
          {generateTimeOptions().map(timeOption => (
            <option key={timeOption} value={timeOption}>
              {timeOption}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Icon name="Clock" className="h-5 w-5 text-gray-400" />
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
