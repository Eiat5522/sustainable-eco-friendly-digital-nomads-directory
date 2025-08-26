// Mock data for featured venues following the project's DTO pattern
import type { FeaturedListingDTO } from '@/types/dto';

export const mockFeaturedVenues: FeaturedListingDTO[] = [
  {
    id: "banyan-tree-phuket",
    name: "Banyan Tree Phuket",
    slug: "banyan-tree-phuket",
    imageUrl: "https://images.unsplash.com/photo-1587773389911-700ddd6b8190?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxyZXNvcnQlMjB0cm9waWNhbCUyMGx1eHVyeSUyMHRoYWlsYW5kJTIwcGFsbSUyMHRyZWVzfGVufDB8MHx8Z3JlZW58MTc1NjE5OTYxMnww&ixlib=rb-4.1.0&q=85",
    city: "Phuket",
    amenityNames: ["Solar Powered", "Zero Waste", "Local Sourcing", "High-Speed WiFi", "Coworking Space", "Meeting Rooms"]
  },
  {
    id: "katathani-phuket-beach-resort",
    name: "Katathani Phuket Beach Resort",
    slug: "katathani-phuket-beach-resort",
    imageUrl: "https://images.unsplash.com/photo-1606944605622-c6df94a26e9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHxiZWFjaCUyMHJlc29ydCUyMHBhbG0lMjB0cmVlcyUyMG9jZWFuJTIwdHJvcGljYWx8ZW58MHwwfHxibHVlfDE3NTYxOTk2MTJ8MA&ixlib=rb-4.1.0&q=85",
    city: "Phuket",
    amenityNames: ["Ocean Conservation", "Renewable Energy", "Sustainable Tourism", "Business Center", "WiFi Throughout", "Quiet Work Areas"]
  },
  {
    id: "alt-chiangmai-coworking",
    name: "Alt_ChiangMai Coworking & Coliving / Alt_PingRiver",
    slug: "alt-chiangmai-coworking",
    imageUrl: "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw0fHxjb3dvcmtpbmclMjBvZmZpY2UlMjBtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBjb21wdXRlcnN8ZW58MHwwfHx8MTc1NjE5OTYxMnww&ixlib=rb-4.1.0&q=85",
    city: "Chiang Mai",
    amenityNames: ["Green Building", "Community Garden", "Bike Friendly", "24/7 Access", "High-Speed Internet", "Community Events"]
  }
];