import { Users, Building2, MessageSquare, TrendingUp } from 'lucide-react';

async function getStatsData() {
  // In a real application, this would fetch from your database
  // For now, we'll return mock data
  return {
    totalUsers: 1247,
    totalListings: 89,
    pendingReviews: 23,
    monthlyGrowth: 12.5
  };
}

export default async function DashboardStats() {
  const stats = await getStatsData();

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+8.2%',
      changeType: 'positive' as const
    },
    {
      title: 'Active Listings',
      value: stats.totalListings.toString(),
      icon: Building2,
      color: 'bg-green-500',
      change: '+3.1%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews.toString(),
      icon: MessageSquare,
      color: 'bg-yellow-500',
      change: '-2.4%',
      changeType: 'negative' as const
    },
    {
      title: 'Monthly Growth',
      value: `${stats.monthlyGrowth}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+1.8%',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        );
      })}
    </div>
  );
}