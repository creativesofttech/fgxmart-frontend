import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'

const cookieName = 'fgx_admin_session'

export function adminSessionToken(event: H3Event) {
  const token = getCookie(event, cookieName)
  if (!token) throw createError({ statusCode: 401, message: 'Please sign in as an administrator.' })
  return token
}

export function setAdminSession(event: H3Event, token: string) {
  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, cookieName, { path: '/' })
}

export async function adminBackendRequest(event: H3Event, path: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  contentType?: string
  query?: Record<string, any>
  anonymous?: boolean
} = {}) {
  const config = useRuntimeConfig(event)
  const base = (config.apiBase || config.public.apiBase).replace(/\/$/, '')
  const token = options.anonymous ? null : adminSessionToken(event)

  try {
    return await $fetch<any>(`${base}/admin/${path}`, {
      method: options.method || 'GET',
      body: options.body,
      query: options.query,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
      },
      retry: 0,
      timeout: 30_000,
    })
  } catch (error: any) {
    const statusCode = error.response?.status || 502
    if (statusCode === 401) clearAdminSession(event)
    // Never forward debug traces, upstream headers, or tokens to the browser.
    throw createError({
      statusCode,
      message: statusCode >= 500 ? 'The admin service is unavailable. Please try again.' : (error.data?.message || 'Admin request failed.'),
      data: statusCode < 500 ? { errors: error.data?.errors } : undefined,
    })
  }
}
