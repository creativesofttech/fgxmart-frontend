import { defineEventHandler } from 'h3'
import { adminBackendRequest } from '../../utils/admin-session'

export default defineEventHandler((event) => adminBackendRequest(event, 'user'))
