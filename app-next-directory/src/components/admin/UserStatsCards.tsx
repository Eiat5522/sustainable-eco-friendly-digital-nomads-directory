import { Users, UserCheck, UserX, Clock } from 'lucide-react';

async function getUserStats() {
  // Mock data - in a real app this would come from your database
  return {
    totalUsers: 1247,
    activeUsers: 1198,
    suspendedUsers: 23,
    newThisMonth: 89
  };
}

export default async function UserStatsCards() {
  const stats = await getUserStats();

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500',
      description: 'Currently active accounts'
    },
    {
      title: 'Suspended Users',
      value: stats.suspendedUsers.toString(),
      icon: UserX,
      color: 'bg-red-500',
      description: 'Temporarily suspended'
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth.toString(),
      icon: Clock,
      color: 'bg-purple-500',
      description: 'Recently registered'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-900 font-medium text-sm mb-1">{stat.title}</p>
            <p className="text-gray-600 text-xs">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}