import axios, { AxiosInstance } from 'axios'
import { Platform } from 'react-native'
import {
  User, Listing, PriceCheck, Message, Conversation,
  CropScan, LanguageDetection, Transaction,
} from '../types'

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

function deepTransform(obj: any, fn: (s: string) => string): any {
  if (Array.isArray(obj)) return obj.map((v) => deepTransform(v, fn))
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const out: Record<string, any> = {}
    for (const k of Object.keys(obj)) {
      out[fn(k)] = deepTransform(obj[k], fn)
    }
    return out
  }
  return obj
}

// Get your PC's LAN IP (run `ipconfig`) and put it here
// Android emulator: 10.0.2.2 | Real device: your LAN IP (e.g. 192.168.70.248)
const HOST = Platform.select({
  android: '192.168.70.248',
  ios: 'localhost',
  default: 'localhost',
})
const BASE_URL = `http://${HOST}:8000`

class ApiService {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    this.client.interceptors.response.use((res) => {
      res.data = deepTransform(res.data, toCamel)
      return res
    })

    this.client.interceptors.request.use((config) => {
      if (config.data) {
        config.data = deepTransform(config.data, toSnake)
      }
      return config
    })
  }

  setToken(token: string | null) {
    this.token = token
  }

  // --- Auth ---
  async register(data: {
    username: string; email: string; password: string; role: string
    language?: string; full_name?: string; country?: string
    latitude?: number; longitude?: number; phone?: string
  }): Promise<{ accessToken: string; user: User }> {
    const res = await this.client.post('/auth/register', data)
    return res.data
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const res = await this.client.post('/auth/login', { email, password })
    return res.data
  }

  async getMe(): Promise<User> {
    const res = await this.client.get('/auth/me')
    return res.data
  }

  // --- Location ---
  async detectLanguage(lat: number, lng: number): Promise<LanguageDetection> {
    const res = await this.client.post('/location/detect-language', {
      latitude: lat, longitude: lng,
    })
    return res.data
  }

  async getLanguages(): Promise<{ code: string; name: string }[]> {
    const res = await this.client.get('/location/languages')
    return res.data.languages
  }

  // --- AI ---
  async voiceInquiry(audioBase64: string, sourceLang: string, conversationId?: string): Promise<{
    transcribedText: string; responseText: string; responseAudioBase64: string
    conversationId?: string
  }> {
    const body: any = {
      audio_base64: audioBase64, source_language: sourceLang,
      target_language: sourceLang,
    }
    if (conversationId) body.conversation_id = conversationId
    const res = await this.client.post('/ai/voice-inquiry', body)
    return res.data
  }

  async chat(text: string, language: string, conversationId?: string): Promise<{
    responseText: string; responseAudioBase64: string
    conversationId?: string
  }> {
    const body: any = {
      text, source_language: language, target_language: language,
    }
    if (conversationId) body.conversation_id = conversationId
    const res = await this.client.post('/ai/chat', body)
    return res.data
  }

  async scanCrop(imageBase64: string, language?: string): Promise<CropScan> {
    const res = await this.client.post('/ai/crop-scan', {
      image_base64: imageBase64, language: language || 'rw',
    })
    return res.data
  }

  async translate(text: string, source: string, target: string): Promise<string> {
    const res = await this.client.post('/ai/translate', {
      text, source_language: source, target_language: target,
    })
    return res.data.translatedText
  }

  // --- Marketplace ---
  async getListings(params?: {
    category?: string; country?: string; cropName?: string
    minPrice?: number; maxPrice?: number
  }): Promise<Listing[]> {
    const res = await this.client.get('/marketplace/listings', { params })
    return res.data
  }

  async createListing(data: {
    cropName: string; quantity: number; price: number
    unit?: string; currency?: string; description?: string
    grade?: string; location?: string
  }): Promise<Listing> {
    const res = await this.client.post('/marketplace/listings', data)
    return res.data
  }

  async checkPrice(cropName: string, grade?: string): Promise<PriceCheck> {
    const res = await this.client.post('/marketplace/price-check', {
      crop_name: cropName, grade,
    })
    return res.data
  }

  // --- Chat ---
  async getConversations(): Promise<Conversation[]> {
    const res = await this.client.get('/chat/conversations')
    return res.data
  }

  async getMessages(convId: number): Promise<Message[]> {
    const res = await this.client.get(`/chat/conversations/${convId}/messages`)
    return res.data
  }

  async sendMessage(data: {
    receiverId: number; content: string; sourceLanguage?: string; targetLanguage?: string
    conversationId?: number; listingId?: number
  }): Promise<Message> {
    const res = await this.client.post('/chat/messages', data)
    return res.data
  }

  // --- Handshake ---
  async createHandshake(data: {
    listingId: number; quantity: number; unitPrice: number; currency?: string
  }): Promise<Transaction> {
    const res = await this.client.post('/handshake/create', data)
    return res.data
  }

  async getTransactions(): Promise<Transaction[]> {
    const res = await this.client.get('/handshake/transactions')
    return res.data
  }
}

export const api = new ApiService()
