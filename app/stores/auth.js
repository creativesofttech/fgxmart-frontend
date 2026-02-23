import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
    }),
    getters: {
        isLoggedIn: (state) => !!state.token,
    },
    actions: {
        setToken(token) {
            this.token = token
            localStorage.setItem('auth_token', token)
        },
        setUser(user) {
            this.user = user
            localStorage.setItem('user', JSON.stringify(user))
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
        },
        init() {
            if (process.client) {
                const token = localStorage.getItem('auth_token')
                const user = localStorage.getItem('user')
                if (token) this.token = token
                if (user) this.user = JSON.parse(user)
            }
        }
    }
})
