import { defineStore } from 'pinia'

export const useAddressStore = defineStore('address', {
    state: () => ({
        addresses: [],
        loading: false,
        selectedAddressId: null
    }),

    getters: {
        defaultAddress: (state) => state.addresses?.find(a => a.is_default),
        selectedAddress: (state) => state.addresses?.find(a => a.id === state.selectedAddressId) || state.defaultAddress
    },

    actions: {
        async fetchAddresses() {
            const config = useRuntimeConfig()
            const auth = useAuthStore()
            if (!auth.token) return

            this.loading = true
            try {
                const response = await $fetch(`${config.public.apiBase}/addresses`, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                this.addresses = response.data || []
                if (this.addresses.length > 0 && !this.selectedAddressId) {
                    const defaultAddr = this.addresses.find(a => a.is_default)
                    this.selectedAddressId = defaultAddr ? defaultAddr.id : this.addresses[0].id
                }
            } catch (error) {
                console.error('Error fetching addresses:', error)
            } finally {
                this.loading = false
            }
        },

        async addAddress(addressData) {
            const config = useRuntimeConfig()
            const auth = useAuthStore()

            try {
                const response = await $fetch(`${config.public.apiBase}/addresses`, {
                    method: 'POST',
                    body: addressData,
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                const newAddress = response.data
                this.addresses.push(newAddress)
                if (newAddress.is_default) {
                    this.addresses.forEach(a => {
                        if (a.id !== newAddress.id) a.is_default = false
                    })
                }
                this.selectedAddressId = newAddress.id
                return newAddress
            } catch (error) {
                throw error
            }
        },

        async updateAddress(id, addressData) {
            const config = useRuntimeConfig()
            const auth = useAuthStore()

            try {
                const response = await $fetch(`${config.public.apiBase}/addresses/${id}`, {
                    method: 'PUT',
                    body: addressData,
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                const updatedAddress = response.data
                const index = this.addresses.findIndex(a => a.id === id)
                if (index !== -1) {
                    this.addresses[index] = updatedAddress
                }
                if (updatedAddress.is_default) {
                    this.addresses.forEach(a => {
                        if (a.id !== id) a.is_default = false
                    })
                }
                return updatedAddress
            } catch (error) {
                throw error
            }
        },

        async setDefault(id) {
            const config = useRuntimeConfig()
            const auth = useAuthStore()

            try {
                await $fetch(`${config.public.apiBase}/addresses/${id}/default`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.token}`
                    }
                })
                this.addresses.forEach(a => {
                    a.is_default = a.id === id
                })
            } catch (error) {
                console.error('Error setting default address:', error)
            }
        },

        selectAddress(id) {
            this.selectedAddressId = id
        }
    }
})
