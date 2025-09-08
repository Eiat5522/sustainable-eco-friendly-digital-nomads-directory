// Mock data for featured venues following the project's DTO pattern
import type { FeaturedListingDTO } from '@/types/dto';

export const mockFeaturedVenues: FeaturedListingDTO[] = [
  {
    id: "banyan-tree-phuket",
    name: "Banyan Tree Phuket",
    slug: "banyan-tree-phuket",
    imageUrl: "https://images.unsplash.com/photo-1587773389911-700ddd6b8190?w=640&q=75",
    city: "Phuket",
    amenityNames: ["Solar Powered", "Zero Waste", "Local Sourcing", "High-Speed WiFi", "Coworking Space", "Meeting Rooms"]
  },
  {
    id: "katathani-phuket-beach-resort",
    name: "Katathani Phuket Beach Resort",
    slug: "katathani-phuket-beach-resort",
    imageUrl: "https://images.unsplash.com/photo-1606944605622-c6df94a26e9b?w=640&q=75",
    city: "Phuket",
    amenityNames: ["Ocean Conservation", "Renewable Energy", "Sustainable Tourism", "Business Center", "WiFi Throughout", "Quiet Work Areas"]
  },
  {
    id: "alt-chiangmai-coworking",
    name: "Alt_ChiangMai Coworking & Coliving / Alt_PingRiver",
    slug: "alt-chiangmai-coworking",
    imageUrl: "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?w=640&q=75",
    city: "Chiang Mai",
    amenityNames: ["Green Building", "Community Garden", "Bike Friendly", "24/7 Access", "High-Speed Internet", "Community Events"]
  },
  {
    id: "the-yard-hostel",
    name: "The Yard Hostel",
    slug: "the-yard-hostel",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=75",
    city: "Bangkok",
    amenityNames: ["Recycled Materials", "Urban Garden", "Composting", "Community Kitchen", "Free Bicycles", "High-Speed WiFi"]
  },
  {
    id: "d-well-hostel",
    name: "D-Well Hostel",
    slug: "d-well-hostel",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=640&q=75",
    city: "Chiang Mai",
    amenityNames: ["Energy-Efficient", "Water Conservation", "Rooftop Terrace", "Coworking Area", "High-Speed WiFi", "Secure Lockers"]
  },
  {
    id: "green-tiger-house",
    name: "Green Tiger House",
    slug: "green-tiger-house",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=640&q=75",
    city: "Chiang Mai",
    amenityNames: ["Vegetarian Restaurant", "Solar Hot Water", "No Single-Use Plastic", "Yoga Classes", "Free WiFi", "Tour Desk"]
  },
  {
    id: "hub53",
    name: "Hub53 Coworking and Coliving Space",
    slug: "hub53",
    imageUrl: "https://images.unsplash.com/photo-1582582494705-5322d3415b59?w=640&q=75",
    city: "Chiang Mai",
    amenityNames: ["24/7 Access", "Ergonomic Chairs", "Meeting Rooms", "Call Rooms", "High-Speed WiFi", "Community Events"]
  },
  {
    id: "ko-hub",
    name: "KohHub",
    slug: "koh-hub",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&q=75",
    city: "Koh Lanta",
    amenityNames: ["Beachfront", "Coworking Space", "Coliving", "Restaurant", "High-Speed WiFi", "Weekly Talks"]
  }
];