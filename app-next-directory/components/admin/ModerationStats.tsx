import { AlertTriangle, Flag, MessageSquare, Building2 } from 'lucide-react';

async function getModerationStats() {
  // Mock data - in a real app this would come from your database
  return {
    pendingReports: 12,
    flaggedContent: 8,
    pendingReviews: 23,
    suspendedListings: 5
  };
}

export default async function ModerationStats() {
  const stats = await getModerationStats();

  const statCards = [
    {
      title: 'Pending Reports',
      value: stats.pendingReports.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'User reports to review'
    },
    {
      title: 'Flagged Content',
      value: stats.flaggedContent.toString(),
      icon: Flag,
      color: 'bg-orange-500',
      description: 'Content flagged by users'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews.toString(),
      icon: MessageSquare,
      color: 'bg-yellow-500',
      description: 'Reviews awaiting approval'
    },
    {
      title: 'Suspended Listings',
      value: stats.suspendedListings.toString(),
      icon: Building2,
      color: 'bg-purple-500',
      description: 'Temporarily suspended listings'
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