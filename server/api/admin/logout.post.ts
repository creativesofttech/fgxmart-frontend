import { defineEventHandler } from 'h3'
import { adminBackendRequest, clearAdminSession } from '../../utils/admin-session'

export default defineEventHandler(async (event) => {
  try {
    await adminBackendRequest(event, 'logout', { method: 'POST' })
  } catch (error: any) {
    if (error.statusCode !== 401) throw error
  }
  clearAdminSession(event)
  return { message: 'Logged out.' }
})
