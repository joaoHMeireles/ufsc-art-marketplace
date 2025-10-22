export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isUfscStudent: boolean;
  createdAt: Date;
}

export interface ArtItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  type: 'venda' | 'aluguel' | 'doacao';
  category: 'pintura' | 'escultura' | 'desenho' | 'fotografia' | 'outros';
  images: string[];
  condition: 'novo' | 'usado' | 'precisa_restauro';
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  location: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  itemId: string;
  itemTitle: string;
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterOptions {
  type?: 'venda' | 'aluguel' | 'doacao';
  category?: 'pintura' | 'escultura' | 'desenho' | 'fotografia' | 'outros';
  condition?: 'novo' | 'usado' | 'precisa_restauro';
  priceRange?: {
    min?: number;
    max?: number;
  };
}