export interface Category {
  id: string;
  name: string;
  color?: string;
  iconUrl?: string;
  icon?: string; // Emoji or icon name
  allocatedAmount?: number;
  createdDate: Date;
  createdBy: string;
}

