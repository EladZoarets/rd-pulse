import { mockApi } from './mock'
import { realApi } from './real'

export const api = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : realApi
