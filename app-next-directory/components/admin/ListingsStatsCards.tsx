import { Building2, Eye, EyeOff, Clock, CheckCircle } from 'lucide-react';

async function getListingsStats() {
  // Mock data - in a real app this would come from your database
  return {
    totalListings: 89,
    activeListings: 76,
    pendingListings: 8,
    approvedListings: 73
  };
}

export default async function ListingsStatsCards() {
  const stats = await getListingsStats();

  const statCards = [
    {
      title: 'Total Listings',
      value: stats.totalListings.toString(),
      icon: Building2,
      color: 'bg-blue-500',
      description: 'All venue listings'
    },
    {
      title: 'Active Listings',
      value: stats.activeListings.toString(),
      icon: Eye,
      color: 'bg-green-500',
      description: 'Currently visible to users'
    },
    {
      title: 'Pending Approval',
      value: stats.pendingListings.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Awaiting review'
    },
    {
      title: 'Approved Listings',
      value: stats.approvedListings.toString(),
      icon: CheckCircle,
      color: 'bg-emerald-500',
      description: 'Reviewed and approved'
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