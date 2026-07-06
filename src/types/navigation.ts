export type NavTabId = 'home' | 'map' | 'report' | 'issues';

export interface NavTabItem {
  id: NavTabId;
  label: string;
  route: string;
  iconName: 'home' | 'map' | 'report' | 'issues';
  isPrimaryAction?: boolean;
}

export const NAV_ITEMS: NavTabItem[] = [
  { id: 'home', label: 'Home', route: '/', iconName: 'home' },
  { id: 'map', label: 'City Map', route: '/map', iconName: 'map' },
  { id: 'report', label: 'Report Issue', route: '/report', iconName: 'report', isPrimaryAction: true },
  { id: 'issues', label: 'My Issues', route: '/issues', iconName: 'issues' },
];
