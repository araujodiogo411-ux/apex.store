export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "Visitante" | "Administrador Oficial APEXCRAFT";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[]; // Base64 data URLs or links
  videos: string[]; // Optional Base64 data URLs or links
  category: string;
  price?: number; // Optional
  createdAt: number; // timestamp
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: number; // timestamp
}

export interface Sample {
  id: string;
  imageUrl: string; // Base64 or link
  createdAt: number;
}

export interface SystemSettings {
  whatsapp: string;
  email: string;
  instagram: string;
  linkAction: "whatsapp" | "instagram"; // configuring what clicks on sample images open
}
