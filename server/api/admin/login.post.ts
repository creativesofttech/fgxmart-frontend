import { defineEventHandler, readBody, createError } from 'h3'
import { adminBackendRequest, setAdminSession } from '../../utils/admin-session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
    throw createError({ statusCode: 422, message: 'Email and password are required.' })
  }
  const response = await adminBackendRequest(event, 'secure-admin-fgx', {
    method: 'POST', body: { email: body.email, password: body.password }, anonymous: true,
  })
  if (!response.data?.token) throw createError({ statusCode: 502, message: 'Invalid admin login response.' })
  setAdminSession(event, response.data.token)
  return { message: 'Signed in successfully.' }
})
