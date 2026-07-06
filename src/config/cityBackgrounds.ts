export interface CityBackgroundConfig {
  id: string;
  displayName: string;
  stateName: string;
  description: string;
  videoUrl?: string;
  fallbackImage: string;
}

export const cityBackgrounds: Record<string, CityBackgroundConfig> = {
  visakhapatnam: {
    id: 'visakhapatnam',
    displayName: 'Visakhapatnam',
    stateName: 'Andhra Pradesh',
    description: 'Smart Port City & Municipal Command Zone',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-city-and-its-traffic-40763-large.mp4',
    fallbackImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=2000&q=85',
  },
  hyderabad: {
    id: 'hyderabad',
    displayName: 'Hyderabad',
    stateName: 'Telangana',
    description: 'Greater Hyderabad Municipal Corporation',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-and-buildings-40764-large.mp4',
    fallbackImage: 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?auto=format&fit=crop&w=2000&q=85',
  },
  delhi: {
    id: 'delhi',
    displayName: 'Delhi NCR',
    stateName: 'Delhi',
    description: 'National Capital Territory Zone',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-busy-city-intersection-40765-large.mp4',
    fallbackImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=2000&q=85',
  },
  default: {
    id: 'default',
    displayName: 'Visakhapatnam',
    stateName: 'Andhra Pradesh',
    description: 'Civic Intelligence Command Zone',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-city-and-its-traffic-40763-large.mp4',
    fallbackImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=2000&q=85',
  },
};

export const getCityConfig = (cityKey?: string): CityBackgroundConfig => {
  if (!cityKey) return cityBackgrounds.default;
  const key = cityKey.toLowerCase().trim();
  return cityBackgrounds[key] || cityBackgrounds.default;
};
