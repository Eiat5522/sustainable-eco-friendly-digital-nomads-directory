import type { City } from '@/types/sanity.types';
import React from 'react';

interface CityStatsProps {
  city: City;
}

const CityStats: React.FC<CityStatsProps> = ({ city }) => {
  // Only show canonical stats from the City type
  const stats = [
    city.sustainabilityScore !== undefined && {
      label: 'Sustainability Score',
      value: city.sustainabilityScore,
      icon: (
        <svg className="icon" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">{city.sustainabilityScore}</text>
        </svg>
      ),
    },
    city.highlights && city.highlights.length > 0 && {
      label: 'Highlights',
      value: city.highlights.join(', '),
      icon: (
        <svg className="icon" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ].filter(Boolean);


  return (
    <>
      {stats.map((stat, index) =>
        stat ? (
          <div key={index} className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-md bg-green-50 text-green-600">
                {stat.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
            </div>
          </div>
        ) : null
      )}
    </>
  );
};

export default CityStats;
