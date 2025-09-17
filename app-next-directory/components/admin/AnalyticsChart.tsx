'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart() {
  // Mock data - in a real app this would come from your analytics API
  const data = [
    { name: 'Jan', users: 400, listings: 24 },
    { name: 'Feb', users: 300, listings: 31 },
    { name: 'Mar', users: 500, listings: 28 },
    { name: 'Apr', users: 680, listings: 35 },
    { name: 'May', users: 590, listings: 42 },
    { name: 'Jun', users: 820, listings: 38 },
  ];

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Platform Growth
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Users"
            />
            <Line 
              type="monotone" 
              dataKey="listings" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Listings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Listings</span>
        </div>
      </div>
    </div>
  );
}