import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Listing, PriceCheck } from '../../types'
import { api } from '../../services/api'

interface MarketState {
  listings: Listing[]
  priceCache: Record<string, PriceCheck>
  isLoading: boolean
  error: string | null
}

const initialState: MarketState = {
  listings: [],
  priceCache: {},
  isLoading: false,
  error: null,
}

export const fetchListings = createAsyncThunk(
  'market/fetchListings',
  async (params: {
    category?: string; country?: string; cropName?: string
  } | undefined, { rejectWithValue }) => {
    try {
      return await api.getListings(params)
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'Failed to fetch listings')
    }
  }
)

export const checkPrice = createAsyncThunk(
  'market/checkPrice',
  async (data: { cropName: string; grade?: string }, { rejectWithValue }) => {
    try {
      return await api.checkPrice(data.cropName, data.grade)
    } catch (e: any) {
      return rejectWithValue('Price check failed')
    }
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => { state.isLoading = true })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.isLoading = false
        state.listings = action.payload
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(checkPrice.fulfilled, (state, action) => {
        const key = action.payload.cropName.toLowerCase()
        state.priceCache[key] = action.payload
      })
  },
})

export default marketSlice.reducer
