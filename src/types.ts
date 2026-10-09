export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  disabled?: boolean;
  createdAt: string;
}

export interface ItemUrl {
  id?: string;
  url: string;
  description: string;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  categories: string[]; // e.g. ["retro", "proyecto/hardware", "tecnología"]
  rawCategories?: string; // original input string
  urls?: ItemUrl[]; // One or more URLs before the content with short descriptions
  content?: string; // Ample markdown content
  notes?: string; // Legacy fallback
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNode {
  name: string;        // display name e.g. "hardware"
  path: string;        // canonical path e.g. "proyecto/hardware"
  depth: number;
  itemCount: number;   // total items matching this path or its descendants
  directCount: number; // items directly assigned to this specific path
  children: CategoryNode[];
}
