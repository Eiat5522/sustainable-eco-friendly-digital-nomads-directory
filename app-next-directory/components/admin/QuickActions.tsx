import Link from 'next/link';
import { 
  UserPlus, 
  Plus, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  Settings 
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Add User',
      description: 'Create a new user account',
      href: '/admin/users/new',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'New Listing',
      description: 'Add a new venue listing',
      href: '/admin/listings/new',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Moderation Queue',
      description: 'Review flagged content',
      href: '/admin/moderation',
      icon: Shield,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'View Analytics',
      description: 'Check platform metrics',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Review Comments',
      description: 'Moderate user reviews',
      href: '/admin/reviews',
      icon: MessageSquare,
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group block p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {action.title}
              </h3>
              <p className="text-xs text-gray-600">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}