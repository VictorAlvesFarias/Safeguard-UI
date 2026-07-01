import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/app-slice'
import pipelineReducer from './slices/pipeline-slice'

export const store =  configureStore({
  reducer: {
    app: appReducer,
    pipeline: pipelineReducer,
  }
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']