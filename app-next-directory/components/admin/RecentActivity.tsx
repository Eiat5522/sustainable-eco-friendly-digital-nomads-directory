import { Clock, User, Building2, MessageSquare } from 'lucide-react';

async function getRecentActivity() {
  // Mock data - in a real app this would come from your database
  return [
    {
      id: 1,
      type: 'user',
      action: 'New user registered',
      details: 'john.doe@example.com',
      timestamp: '2 minutes ago',
      icon: User,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      type: 'listing',
      action: 'Listing updated',
      details: 'Eco Lodge Barcelona',
      timestamp: '15 minutes ago',
      icon: Building2,
      color: 'bg-green-500'
    },
    {
      id: 3,
      type: 'review',
      action: 'New review submitted',
      details: 'Green Haven Hostel',
      timestamp: '1 hour ago',
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      type: 'user',
      action: 'User role updated',
      details: 'sarah.wilson@example.com → Editor',
      timestamp: '2 hours ago',
      icon: User,
      color: 'bg-orange-500'
    },
    {
      id: 5,
      type: 'listing',
      action: 'Listing published',
      details: 'Sustainable Workspace Berlin',
      timestamp: '3 hours ago',
      icon: Building2,
      color: 'bg-green-500'
    }
  ];
}

export default async function RecentActivity() {
  const activities = await getRecentActivity();

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${activity.color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {activity.details}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t-2 border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}