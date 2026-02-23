import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [],
        loading: false,
        updatingItems: [] // Track IDs of items being updated
    }),

    getters: {
        totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: (state) => state.items.reduce((sum, item) => {
            const price = Number(item.product.discount_price || item.product.base_price || 0)
            return sum + (price * item.quantity)
        }, 0),
        isEmpty: (state) => state.items.length === 0
    },

    actions: {
        // Initialize cart from localStorage (for guests)
        initCart() {
            const savedCart = localStorage.getItem('guest_cart')
            if (savedCart) {
                this.items = JSON.parse(savedCart)
            }
        },

        async fetchCart() {
            const auth = useAuthStore()
            if (!auth.isLoggedIn) return

            this.loading = true
            try {
                const config = useRuntimeConfig()
                const data = await $fetch(`${config.public.apiBase}/cart`, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                this.items = data
            } catch (err) {
                console.error('Fetch cart error:', err)
            } finally {
                this.loading = false
            }
        },

        async addToCart(product, quantity = 1, options = null) {
            const auth = useAuthStore()
            const { gtag } = useGtag()

            // Emit GA4 add_to_cart event
            gtag('event', 'add_to_cart', {
                currency: 'USD',
                value: Number(product.discount_price || product.base_price || 0) * quantity,
                items: [{
                    item_id: product.id,
                    item_name: product.name,
                    price: Number(product.discount_price || product.base_price || 0),
                    quantity: quantity
                }]
            })

            if (auth.isLoggedIn) {
                try {
                    const config = useRuntimeConfig()
                    const data = await $fetch(`${config.public.apiBase}/cart`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${auth.token}`
                        },
                        body: {
                            product_id: product.id,
                            quantity,
                            options
                        }
                    })
                    // Refresh full cart to ensure sync
                    await this.fetchCart()
                } catch (err) {
                    console.error('Add to cart error:', err)
                }
            } else {
                // Guest Logic
                const existingItem = this.items.find(item =>
                    item.product_id === product.id &&
                    JSON.stringify(item.options) === JSON.stringify(options)
                )

                if (existingItem) {
                    existingItem.quantity += quantity
                } else {
                    this.items.push({
                        product_id: product.id,
                        product: product, // Store product info for UI
                        quantity,
                        options
                    })
                }
                this.persistGuestCart()
            }
        },

        async updateQuantity(itemId, quantity) {
            const auth = useAuthStore()
            if (auth.isLoggedIn) {
                this.updatingItems.push(itemId)
                try {
                    const config = useRuntimeConfig()
                    await $fetch(`${config.public.apiBase}/cart/${itemId}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${auth.token}`
                        },
                        body: { quantity }
                    })
                    await this.fetchCart()
                } catch (err) {
                    console.error('Update quantity error:', err)
                } finally {
                    this.updatingItems = this.updatingItems.filter(id => id !== itemId)
                }
            } else {
                const item = this.items.find(i => i.product_id === itemId || i.id === itemId)
                if (item) {
                    item.quantity = quantity
                    this.persistGuestCart()
                }
            }
        },

        async removeFromCart(itemId) {
            const auth = useAuthStore()
            if (auth.isLoggedIn) {
                try {
                    const config = useRuntimeConfig()
                    await $fetch(`${config.public.apiBase}/cart/${itemId}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${auth.token}`
                        }
                    })
                    await this.fetchCart()
                } catch (err) {
                    console.error('Remove from cart error:', err)
                }
            } else {
                this.items = this.items.filter(i => i.product_id !== itemId)
                this.persistGuestCart()
            }
        },

        async clearCart() {
            const auth = useAuthStore()
            if (auth.isLoggedIn) {
                try {
                    const config = useRuntimeConfig()
                    // We could add a DELETE /cart/clear endpoint, but for now individual
                    for (const item of this.items) {
                        await $fetch(`${config.public.apiBase}/cart/${item.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${auth.token}` }
                        })
                    }
                } catch (err) {
                    console.error('Clear cart error:', err)
                }
            }
            this.items = []
            localStorage.removeItem('guest_cart')
        },

        persistGuestCart() {
            localStorage.setItem('guest_cart', JSON.stringify(this.items))
        },

        async syncCart() {
            const auth = useAuthStore()
            if (!auth.isLoggedIn || this.items.length === 0) return

            try {
                const config = useRuntimeConfig()
                await $fetch(`${config.public.apiBase}/cart/sync`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: {
                        items: this.items.map(item => ({
                            product_id: item.product_id,
                            quantity: item.quantity,
                            options: item.options
                        }))
                    }
                })

                // Clear local after successful sync
                localStorage.removeItem('guest_cart')
                await this.fetchCart()
            } catch (err) {
                console.error('Sync cart error:', err)
            }
        }
    }
})
