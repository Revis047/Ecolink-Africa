import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, LanguageDetection } from '../../types'
import { api } from '../../services/api'

interface AuthState {
  user: User | null
  token: string | null
  detectedLanguage: LanguageDetection | null
  isLoading: boolean
  error: string | null
  onboardingComplete: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  detectedLanguage: null,
  isLoading: false,
  error: null,
  onboardingComplete: false,
}

export const register = createAsyncThunk(
  'auth/register',
  async (data: {
    username: string; email: string; password: string; role: string
    language?: string; full_name?: string; country?: string
    phone?: string; latitude?: number; longitude?: number
  }, { rejectWithValue }) => {
    try {
      const result = await api.register(data)
      api.setToken(result.accessToken)
      return result
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'Registration failed')
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await api.login(data.email, data.password)
      api.setToken(result.accessToken)
      return result
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.detail || 'Login failed')
    }
  }
)

export const detectLanguage = createAsyncThunk(
  'auth/detectLanguage',
  async (coords: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      return await api.detectLanguage(coords.latitude, coords.longitude)
    } catch (e: any) {
      return rejectWithValue('Language detection failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      api.setToken(null)
    },
    setLanguage(state, action: PayloadAction<string>) {
      if (state.user) state.user.language = action.payload
    },
    completeOnboarding(state) {
      state.onboardingComplete = true
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.onboardingComplete = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(detectLanguage.fulfilled, (state, action) => {
        state.detectedLanguage = action.payload
      })
  },
})

export const { logout, setLanguage, completeOnboarding, clearError } = authSlice.actions
export default authSlice.reducer
