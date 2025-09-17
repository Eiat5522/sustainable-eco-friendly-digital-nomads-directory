'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { UserRole, hasPagePermission, hasFeaturePermission } from '@/types/auth';

interface AdminSidebarProps {
  userRole: UserRole;
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      permission: () => hasPagePermission(userRole, 'admin', 'canView')
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      permission: () => hasFeaturePermission(userRole, 'viewUserProfiles')
    },
    {
      name: 'Listings',
      href: '/admin/listings',
      icon: Building2,
      permission: () => hasFeaturePermission(userRole, 'editAllListings')
    },
    {
      name: 'Moderation',
      href: '/admin/moderation',
      icon: Shield,
      permission: () => hasFeaturePermission(userRole, 'moderateListings')
    },
    {
      name: 'Reviews',
      href: '/admin/reviews',
      icon: MessageSquare,
      permission: () => hasFeaturePermission(userRole, 'moderateReviews')
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: FileText,
      permission: () => hasFeaturePermission(userRole, 'editContent')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      permission: () => hasFeaturePermission(userRole, 'accessAnalytics')
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: AlertTriangle,
      permission: () => hasFeaturePermission(userRole, 'viewAuditLogs')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      permission: () => hasFeaturePermission(userRole, 'manageSettings')
    }
  ];

  const visibleItems = navigationItems.filter(item => item.permission());

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r-4 border-black shadow-[8px_0_0_0_rgba(0,0,0,1)] transition-all duration-300 z-30 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                  : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'
              }`}
              {...(isCollapsed ? { title: item.name } : {})}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Role</p>
                <p className="text-sm font-semibold capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}