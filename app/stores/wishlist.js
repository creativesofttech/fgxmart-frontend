import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useWishlistStore = defineStore('wishlist', {
    state: () => ({
        productIds: [], // Current product IDs in wishlist (for sync/toggle)
        items: [],      // Detailed product objects (for wishlist page)
        loading: false
    }),

    getters: {
        totalItems: (state) => state.productIds.length,
        isInWishlist: (state) => (productId) => state.productIds.includes(productId)
    },

    actions: {
        initWishlist() {
            const saved = localStorage.getItem('guest_wishlist')
            if (saved) {
                this.productIds = JSON.parse(saved)
            }
        },

        async fetchWishlist() {
            const auth = useAuthStore()
            if (!auth.isLoggedIn) return

            this.loading = true
            try {
                const config = useRuntimeConfig()
                const data = await $fetch(`${config.public.apiBase}/wishlist`, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                this.items = data.map(item => item.product)
                this.productIds = data.map(item => item.product_id)
            } catch (err) {
                console.error('Fetch wishlist error:', err)
            } finally {
                this.loading = false
            }
        },

        async toggleWishlist(product) {
            const auth = useAuthStore()
            const productId = product.id

            if (auth.isLoggedIn) {
                try {
                    const config = useRuntimeConfig()
                    const data = await $fetch(`${config.public.apiBase}/wishlist/toggle`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${auth.token}`
                        },
                        body: {
                            product_id: productId
                        }
                    })

                    if (data.attached) {
                        if (!this.productIds.includes(productId)) {
                            this.productIds.push(productId)
                            this.items.push(product)
                        }
                    } else {
                        this.productIds = this.productIds.filter(id => id !== productId)
                        this.items = this.items.filter(item => item.id !== productId)
                    }
                } catch (err) {
                    console.error('Toggle wishlist error:', err)
                }
            } else {
                // Guest Logic
                if (this.productIds.includes(productId)) {
                    this.productIds = this.productIds.filter(id => id !== productId)
                    this.items = this.items.filter(item => item.id !== productId)
                } else {
                    this.productIds.push(productId)
                    this.items.push(product)
                }
                this.persistGuestWishlist()
            }
        },

        persistGuestWishlist() {
            localStorage.setItem('guest_wishlist', JSON.stringify(this.productIds))
        },

        async syncWishlist() {
            const auth = useAuthStore()
            if (!auth.isLoggedIn || this.productIds.length === 0) return

            try {
                const config = useRuntimeConfig()
                await $fetch(`${config.public.apiBase}/wishlist/sync`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: {
                        product_ids: this.productIds
                    }
                })

                // Clear local after successful sync
                localStorage.removeItem('guest_wishlist')
                await this.fetchWishlist()
            } catch (err) {
                console.error('Sync wishlist error:', err)
            }
        }
    }
})
