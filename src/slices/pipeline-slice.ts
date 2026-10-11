import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PipelineData {
  captureId: string | null
  domain: string | null
  iconUrl: string | null
  platform: string | null
  email: string | null
  address: string | null
  password: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  providerId: number | null
  iconId: number | null
  platformId: number | null
  emailAddressId: number | null
  emailId: number | null
  isActive: boolean
}

const initialState: { value: PipelineData } = {
  value: {
    captureId: null,
    domain: null,
    iconUrl: null,
    platform: null,
    email: null,
    address: null,
    password: null,
    phone: null,
    firstName: null,
    lastName: null,
    providerId: null,
    iconId: null,
    platformId: null,
    emailAddressId: null,
    emailId: null,
    isActive: false,
  },
}

export const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    setPipelineData: (state, action: PayloadAction<Partial<PipelineData>>) => {
      state.value = { ...state.value, ...action.payload, isActive: true }
    },
    clearPipelineData: (state) => {
      state.value = { ...initialState.value }
    },
  },
})

export const { setPipelineData, clearPipelineData } = pipelineSlice.actions
export default pipelineSlice.reducer
