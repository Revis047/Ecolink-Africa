export interface User {
  id: number
  username: string
  email: string
  role: 'farmer' | 'buyer'
  language: string
  fullName?: string
  country?: string
  phone?: string
  farmName?: string
  companyName?: string
  isVerified: boolean
}

export interface Listing {
  id: number
  farmerId: number
  farmerName?: string
  farmName?: string
  farmerCountry?: string
  cropName: string
  cropNameZh?: string
  category?: string
  grade?: string
  quantity: number
  unit: string
  price: number
  currency: string
  priceUsd?: number
  description?: string
  images?: string[]
  location?: string
  country?: string
  status: 'active' | 'pending' | 'sold' | 'cancelled'
  qualityScore?: number
  harvestDate?: string
  createdAt: string
}

export interface PriceCheck {
  cropName: string
  grade?: string
  priceKes: number
  priceUsd: number
  priceCny: number
  trend: 'up' | 'down'
  percentageChange: number
  source: string
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  receiverId: number
  content: string
  contentOriginal?: string
  sourceLanguage?: string
  targetLanguage?: string
  audioUrl?: string
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: number
  buyerId: number
  buyerName: string
  farmerId: number
  farmerName: string
  listingId?: number
  listingTitle?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  createdAt: string
}

export interface CropScan {
  id: number
  cropType: string
  diseaseName: string
  diseaseNameLocal: string
  confidence: number
  treatmentPlan: string
  treatmentPlanLocal: string
  isHealthy: boolean
  createdAt: string
}

export interface LanguageDetection {
  country: string
  language: string
  languageName: string
  allLanguages: { code: string; name: string }[]
}

export interface Transaction {
  id: number
  listingId: number
  cropName: string
  buyerId: number
  buyerName: string
  farmerId: number
  farmerName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  status: string
  contractHash?: string
  createdAt: string
}
