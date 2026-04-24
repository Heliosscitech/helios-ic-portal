export type PressCategory = 'Haber' | 'Duyuru' | 'Bülten';
export type PressTab = 'linkedin' | 'website' | 'instagram';

export interface PressItem {
  id: string;
  title: string;
  date: string;
  category: PressCategory;
  linkedin: string;
  website: string;
  instagram: string;
}
