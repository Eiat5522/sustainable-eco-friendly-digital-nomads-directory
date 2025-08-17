'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    CheckCircle,
    Clock,
    Eye,
    Flag,
    Home,
    MapPin,
    MoreHorizontal,
    Search,
    Star,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ListingStats {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  flaggedListings: number;
  averageRating: number;
  totalViews: number;
}

interface Listing {
  id: string;
  title: string;
  type: 'accommodation' | 'coworking' | 'restaurant' | 'activity';
  status: 'published' | 'pending' | 'flagged' | 'draft' | 'rejected';
  location: {
    city: string;
    country: string;
  };
  views: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  sustainabilityScore: number;
  features: string[];
  price?: {
    amount: number;
    currency: string;
    period: string;
  };
  rating?: number;
  reviewCount?: number;
}

export default function ListingsPage() {
  const [listingStats, setListingStats] = useState<ListingStats>({
    totalListings: 0,
    publishedListings: 0,
    pendingListings: 0,
    flaggedListings: 0,
    
    totalViews: 0,
    averageRating: 0,
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'accommodation' | 'coworking' | 'restaurant' | 'activity'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'flagged' | 'draft' | 'rejected'>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API calls
      const mockStats: ListingStats = {
        totalListings: 156,
        publishedListings: 142,
        pendingListings: 8,
        flaggedListings: 3,
        averageRating: 4.2, // Assuming a default average rating
        totalViews: 15420,
      };

      const mockListings: Listing[] = [
        {
          id: '1',
          title: 'Eco-Friendly Co-working Space in Bali',
          type: 'coworking',
          status: 'published',
          location: {
            city: 'Ubud',
            country: 'Indonesia',
          },
          rating: 3.2,
          reviewCount: 8,
          views: 342,
          createdAt: '2024-11-15T10:30:00Z',
          updatedAt: '2024-12-18T14:20:00Z',
          author: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
          },
          sustainabilityScore: 92,
          features: ['Solar Power', 'Recycling Program', 'Local Materials'],
          price: {
            amount: 25,
            currency: 'USD',
            period: 'day',
          },
        },
        {
          id: '2',
          title: 'Solar-Powered Accommodation in Costa Rica',
          type: 'accommodation',
          status: 'flagged',
          location: {
            city: 'San José',
            country: 'Costa Rica',
          },
          views: 89,
          createdAt: '2024-12-10T15:45:00Z',
          updatedAt: '2024-12-19T09:30:00Z',
          author: {
            id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
          sustainabilityScore: 78,
          features: ['Solar Power', 'Rainwater Harvesting'],
          price: {
            amount: 85,
            currency: 'USD',
            period: 'night',
          },
        },
        {
          id: '3',
          title: 'Sustainable Farm-to-Table Restaurant',
          type: 'restaurant',
          status: 'pending',
          location: {
            city: 'Lisbon',
            country: 'Portugal',
          },
          rating: 4.5,
          reviewCount: 15,
          views: 123,
          createdAt: '2024-12-18T09:15:00Z',
          updatedAt: '2024-12-19T11:00:00Z',
          author: {
            id: 'user3',
            name: 'Alice Johnson',
            email: 'alice@example.com',
          },
          sustainabilityScore: 88,
          features: ['Organic Ingredients', 'Zero Waste', 'Local Sourcing'],
        },
      ];

      setListingStats(mockStats);
      setListings(mockListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || listing.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (type) {
      case 'accommodation': return 'default';
      case 'coworking': return 'secondary';
      case 'restaurant': return 'outline';
      case 'activity': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'published': return 'default';
      case 'pending': return 'secondary';
      case 'flagged': return 'destructive';
      case 'draft': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'flagged': return <Flag className="h-4 w-4 text-red-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return '🏠';
      case 'coworking': return '💼';
      case 'restaurant': return '🍽️';
      case 'activity': return '🎯';
      default: return '📋';
    }
  };

  const handleListingAction = async (listingId: string, action: 'publish' | 'flag' | 'reject' | 'delete' | 'edit') => {
    // TODO: Implement actual listing management actions
    console.log(`${action} listing ${listingId}`);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        data-testid="admin-listings-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-lg">Loading listings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listings Management</h1>
          <p className="text-gray-600 mt-2">Manage directory listings, reviews, and content quality</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchListings} disabled={loading}>
            Refresh Data
          </Button>
          <Button onClick={() => { /* shortcut to moderation tools */ }} variant="ghost" data-testid="moderate-button">
            Moderation
          </Button>
        </div>
      </div>

      {/* Listing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingStats.totalListings}</div>
            <p className="text-xs text-muted-foreground">All listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{listingStats.publishedListings}</div>
            <p className="text-xs text-muted-foreground">Live listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{listingStats.pendingListings}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{listingStats.flaggedListings}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{listingStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">Overall quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{listingStats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Listings Management */}
      {listingStats.flaggedListings > 0 && (
        <div
          data-testid="flagged-listings"
          className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4"
          role="region"
          aria-labelledby="flagged-listings-heading"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 id="flagged-listings-heading" className="font-semibold text-yellow-800">Flagged Listings</h3>
              <p className="text-sm text-yellow-700">{listingStats.flaggedListings} items require attention</p>
            </div>
            <div>
              <Button
                onClick={() => setStatusFilter('flagged')}
                variant="outline"
                data-testid="review-flagged"
              >
                Review Flagged
              </Button>
            </div>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Directory Listings</CardTitle>
          <CardDescription>
            Manage all directory listings, their status, and content quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm((e.currentTarget as HTMLInputElement).value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              aria-label="Filter by listing type"
              value={typeFilter}
              onChange={(e: any) => setTypeFilter((e.currentTarget as HTMLSelectElement).value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="accommodation">Accommodation</option>
              <option value="coworking">Co-working</option>
              <option value="restaurant">Restaurant</option>
              <option value="activity">Activity</option>
            </select>
            <select
              aria-label="Filter by listing status"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter((e.currentTarget as HTMLSelectElement).value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Listings List */}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={listing.status === 'pending' ? 'pending-listing' : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getTypeIcon(listing.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        {getStatusIcon(listing.status)}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {listing.location.city}, {listing.location.country}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {listing.author.name} • Created: {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {listing.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {listing.views} views
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {listing.sustainabilityScore}% sustainable
                      </div>
                      {listing.price && (
                        <div className="text-sm text-gray-800 font-medium">
                          {listing.price.currency} {listing.price.amount}/{listing.price.period}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getTypeBadgeVariant(listing.type)}>
                        {listing.type}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(listing.status)}>
                        {listing.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleListingAction(listing.id, 'edit')}>
                          View/Edit Listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {listing.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleListingAction(listing.id, 'publish')}
                            className="text-green-600"
                            data-testid="approve-listing"
                          >
                            Approve & Publish
                          </DropdownMenuItem>
                        )}
                        {listing.status === 'published' && (
                          <DropdownMenuItem
                            onClick={() => handleListingAction(listing.id, 'flag')}
                            className="text-orange-600"
                          >
                            Flag for Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleListingAction(listing.id, 'reject')}
                          className="text-red-600"
                        >
                          Reject Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleListingAction(listing.id, 'delete')}
                          className="text-red-600"
                          data-testid="delete-button"
                        >
                          Delete Listing
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 &&
            <div className="text-center py-8 text-gray-500">
              No listings found matching your criteria.
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
