<template>
  <div class="checkout-page py-12 bg-grey-lighten-4 min-h-screen">
    <v-container class="custom-container">
      <v-row>
        <!-- Left Section: Checkout Steps -->
        <v-col cols="12" lg="8">
          <div class="checkout-steps">
            
            <!-- 1. Delivery Address -->
            <div class="checkout-step mb-6">
              <div class="d-flex align-center mb-4">
                <div class="step-icon mr-4">
                  <v-icon icon="mdi-map-marker" color="primary"></v-icon>
                </div>
                <h2 class="text-h5 font-weight-bold">Delivery Address</h2>
              </div>
              
              <v-card class="rounded-xl border pa-6" elevation="0">
                <!-- Address List -->
                <div v-if="(addressStore.addresses?.length || 0) > 0 && !showAddressForm">
                  <v-radio-group v-model="addressStore.selectedAddressId" hide-details class="ma-0 pa-0 w-100">
                    <v-row>
                      <v-col 
                        v-for="address in addressStore.addresses" 
                        :key="address.id" 
                        cols="12" 
                        md="6"
                      >
                        <v-card 
                          class="address-card rounded-lg pa-4 border cursor-pointer h-100 position-relative"
                          :class="{'border-primary bg-primary-lighten-5': addressStore.selectedAddressId === address.id}"
                          @click="addressStore.selectAddress(address.id)"
                          elevation="0"
                        >
                          <div class="d-flex justify-space-between align-start mb-2">
                            <div class="d-flex align-center">
                              <v-radio :value="address.id" color="primary" class="ma-0 mr-2"></v-radio>
                              <span class="font-weight-bold text-subtitle-1">{{ address.name }}</span>
                            </div>
                            <v-chip size="x-small" color="primary" label variant="flat" class="text-uppercase font-weight-bold">
                              {{ address.type }}
                            </v-chip>
                          </div>
                          
                          <div class="text-body-2 text-grey-darken-1 pl-8">
                            <p class="mb-1">{{ address.address_line_1 }}</p>
                            <p class="mb-1" v-if="address.address_line_2">{{ address.address_line_2 }}</p>
                            <p class="mb-1">{{ address.city }}, {{ address.state }}, {{ address.zipcode }}</p>
                            <p class="mb-3">{{ address.country?.name || 'Country' }}</p>
                            <p class="font-weight-bold ml-n6">Phone: {{ address.phone_number }}</p>
                          </div>

                          <v-btn
                            icon="mdi-pencil-outline"
                            variant="text"
                            size="small"
                            color="grey"
                            class="position-absolute bottom-0 right-0 ma-2"
                            @click.stop="editAddress(address)"
                          ></v-btn>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-radio-group>
                  
                  <v-btn 
                    variant="outlined" 
                    color="primary" 
                    block 
                    class="rounded-lg text-none font-weight-bold mt-4" 
                    prepend-icon="mdi-plus"
                    @click="showAddressForm = true; editingAddressId = null; resetAddressForm()"
                  >
                    Add New Address
                  </v-btn>
                </div>

                <!-- No addresses or adding/editing -->
                <div v-else>
                  <v-form ref="addressFormRef" @submit.prevent="saveAddress">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="addressForm.name"
                          label="Full Name"
                          placeholder="Your full name"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'Name is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="addressForm.phone_number"
                          label="Phone Number"
                          placeholder="+1 234 567 890"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'Phone is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="addressForm.type"
                          :items="['Home', 'Office', 'Other']"
                          label="Address Type"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                        ></v-select>
                      </v-col>
                       <v-col cols="12" md="6">
                        <v-autocomplete
                          v-model="addressForm.country_id"
                          :items="countries"
                          item-title="name"
                          item-value="id"
                          label="Country"
                          placeholder="Search or select country"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'Country is required']"
                          auto-select-first
                        ></v-autocomplete>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="addressForm.address_line_1"
                          label="Address Line 1"
                          placeholder="Street address, P.O. box"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'Address is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="addressForm.address_line_2"
                          label="Address Line 2 (Optional)"
                          placeholder="Apartment, suite, unit, building, floor"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="addressForm.city"
                          label="City"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'City is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="addressForm.state"
                          label="State"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'State is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="addressForm.zipcode"
                          label="Zip Code"
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :rules="[v => !!v || 'Zipcode is required']"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-checkbox
                          v-model="addressForm.is_default"
                          label="Make this my default address"
                          hide-details
                          color="primary"
                        ></v-checkbox>
                      </v-col>
                    </v-row>
                    
                    <div class="d-flex gap-4 mt-4">
                      <v-btn
                        color="primary"
                        type="submit"
                        class="rounded-lg text-none font-weight-bold px-8"
                        elevation="0"
                        :loading="addressLoading"
                      >
                        {{ editingAddressId ? 'Update Address' : 'Save Address' }}
                      </v-btn>
                      <v-btn
                        v-if="addressStore.addresses.length > 0"
                        variant="text"
                        color="grey"
                        class="rounded-lg text-none"
                        @click="showAddressForm = false"
                      >
                        Cancel
                      </v-btn>
                    </div>
                  </v-form>
                </div>
              </v-card>
            </div>

            <!-- 2. Estimated Delivery -->
            <div class="checkout-step mb-6">
              <div class="d-flex align-center mb-4">
                <div class="step-icon mr-4">
                  <v-icon icon="mdi-truck-delivery" color="primary"></v-icon>
                </div>
                <h2 class="text-h5 font-weight-bold">Estimated Delivery</h2>
              </div>
              
              <v-card class="rounded-xl border pa-8" elevation="0">
                <div class="delivery-points">
                  <div class="d-flex align-start mb-4">
                    <v-icon icon="mdi-clock-outline" color="secondary" class="mr-3 mt-1"></v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Standard Timeframe</div>
                      <div class="text-body-2 text-grey-darken-1">Most orders are delivered within 5 - 7 business days after order confirmation.</div>
                    </div>
                  </div>
                  <div class="d-flex align-start mb-4">
                    <v-icon icon="mdi-earth" color="secondary" class="mr-3 mt-1"></v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Global Shipping</div>
                      <div class="text-body-2 text-grey-darken-1">We utilize premium international logistics to ensure your items arrive safely regardless of your location.</div>
                    </div>
                  </div>
                  <div class="d-flex align-start">
                    <v-icon icon="mdi-alert-circle-outline" color="secondary" class="mr-3 mt-1"></v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Possible Delays</div>
                      <div class="text-body-2 text-grey-darken-1">Occasional delays may occur due to customs processing, regional holidays, or extreme weather conditions.</div>
                    </div>
                  </div>
                </div>
              </v-card>
            </div>

            <!-- 3. Payment Option -->
            <div class="checkout-step mb-6">
              <div class="d-flex align-center mb-4">
                <div class="step-icon mr-4">
                  <v-icon icon="mdi-credit-card" color="primary"></v-icon>
                </div>
                <h2 class="text-h5 font-weight-bold">Payment Option</h2>
              </div>
              
              <v-card class="rounded-xl border pa-8" elevation="0">
                <v-row>
                  <!-- Left 50%: Account Details -->
                  <v-col cols="12" md="6" class="border-e-md pr-md-8">
                    <div class="text-subtitle-1 font-weight-bold mb-4 text-primary">Bank Wire Transfer Details</div>
                    <div class="account-details bg-grey-lighten-4 rounded-lg pa-4">
                      <div class="mb-3">
                        <div class="text-caption text-grey text-uppercase font-weight-bold">Account Name</div>
                        <div class="text-body-1 font-weight-bold">{{ primaryBank?.account_name || 'FGX Global Trading LLC' }}</div>
                      </div>
                      <div class="mb-3">
                        <div class="text-caption text-grey text-uppercase font-weight-bold">Bank Name</div>
                        <div class="text-body-1 font-weight-bold">{{ primaryBank?.bank_name || 'Standard Chartered Bank' }}</div>
                      </div>
                      <div class="mb-3">
                        <div class="text-caption text-grey text-uppercase font-weight-bold">Account Number</div>
                        <div class="text-body-1 font-weight-bold">{{ primaryBank?.account_number || '9876543210123' }}</div>
                      </div>
                      <div v-if="primaryBank?.swift_iban">
                        <div class="text-caption text-grey text-uppercase font-weight-bold">SWIFT / IBAN</div>
                        <div class="text-body-1 font-weight-bold">{{ primaryBank.swift_iban }}</div>
                      </div>
                    </div>
                    <p class="text-caption text-grey mt-4 italic">
                      Please include your Order ID as the reference for the transfer.
                    </p>
                  </v-col>

                  <!-- Right 50%: Actions -->
                  <v-col cols="12" md="6" class="pl-md-8">
                    <v-btn 
                      color="primary" 
                      variant="outlined" 
                      block 
                      size="large" 
                      rounded="lg" 
                      class="mb-8 text-none font-weight-bold"
                      prepend-icon="mdi-file-download-outline"
                      @click="downloadInvoice"
                    >
                      Download Proforma Invoice
                    </v-btn>

                    <h3 class="text-subtitle-1 font-weight-black mb-4 text-uppercase letter-spacing-1">SEND TO</h3>
                    
                    <div class="d-flex flex-column gap-3">
                      <v-btn 
                        color="#25D366" 
                        class="text-white text-none font-weight-bold rounded-lg" 
                        block
                        prepend-icon="mdi-whatsapp"
                        size="large"
                        :href="`https://wa.me/${(companyInfo?.phone_number || '971500000000').replace(/[^0-9]/g, '')}`"
                        target="_blank"
                      >
                        WhatsApp Support
                      </v-btn>
                      
                      <div class="d-flex gap-2">
                        <v-btn 
                          color="secondary" 
                          variant="tonal"
                          class="flex-grow-1 text-none font-weight-bold rounded-lg" 
                          prepend-icon="mdi-email-outline"
                          :href="`mailto:${companyInfo?.contact_email || 'support@fgxmart.com'}`"
                        >
                          Email Proof
                        </v-btn>
                        <v-btn 
                          color="primary" 
                          variant="tonal"
                          class="flex-grow-1 text-none font-weight-bold rounded-lg" 
                          prepend-icon="mdi-phone-outline"
                          :href="`tel:${companyInfo?.phone_number || '+971500000000'}`"
                        >
                          Call Now
                        </v-btn>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </div>

          </div>
        </v-col>

        <!-- Right Section: Order Summary -->
        <v-col cols="12" lg="4">
          <div class="sticky-summary">
            <v-card class="rounded-xl border pa-6 mb-6" elevation="0">
              <h2 class="text-h5 font-weight-bold mb-6">Order Summary</h2>
              
              <div class="items-list mb-6">
                <template v-for="item in cart.items" :key="item.id || item.product_id">
                  <div v-if="item.product" class="d-flex align-center mb-4">
                    <v-avatar rounded="lg" size="50" class="bg-grey-lighten-4 border mr-3">
                      <v-img :src="getImageUrl(item.product.cover_image)"></v-img>
                    </v-avatar>
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="text-body-2 font-weight-bold text-truncate">{{ item.product.name }} X {{ item.quantity }}</div>
                    </div>
                    <div class="text-body-2 font-weight-black pl-2">
                      ${{ ((Number(item.product.discount_price || item.product.base_price || item.product.price || 0)) * item.quantity).toFixed(2) }}
                    </div>
                  </div>
                </template>
              </div>

              <v-divider class="mb-4"></v-divider>

              <div class="d-flex justify-space-between mb-2">
                <span class="text-grey-darken-1 font-weight-medium">Subtotal</span>
                <span class="font-weight-bold">${{ cart.totalPrice.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-grey-darken-1 font-weight-medium">Shipping Charge</span>
                <span class="font-weight-bold">$0.00</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-grey-darken-1 font-weight-medium">Tax</span>
                <span class="font-weight-bold">$0.00</span>
              </div>
              
              <!-- Coupon -->
              <div class="coupon-section mb-6">
                <div class="d-flex align-center text-secondary font-weight-bold cursor-pointer">
                  <span>Coupon/Code</span>
                  <v-spacer></v-spacer>
                  <span>-$ 0.00</span>
                </div>
              </div>

              <v-divider class="mb-6"></v-divider>

              <div class="d-flex justify-space-between align-center mb-8">
                <span class="text-h6 font-weight-black">Total (USD)</span>
                <span class="text-h5 font-weight-black text-primary">${{ cart.totalPrice.toFixed(2) }}</span>
              </div>

              <v-btn
                block
                color="secondary"
                height="54"
                class="rounded-lg text-none font-weight-bold text-h6"
                elevation="0"
                :loading="placingOrder"
                @click="placeOrder"
              >
                Place Order
              </v-btn>
            </v-card>

            <v-card class="rounded-xl border pa-6 bg-grey-lighten-5" elevation="0">
              <div class="d-flex align-center mb-4">
                <v-icon icon="mdi-help-circle-outline" color="grey" class="mr-2"></v-icon>
                <span class="text-subtitle-1 font-weight-bold text-grey-darken-3">Why Shipping Charges?</span>
              </div>
              <p class="text-caption text-grey mb-4">
                Shipping rates depend on your location and the size of your order. We work with premium carriers to ensure your fresh groceries arrive safely and on time.
              </p>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Success Dialog -->
    <v-dialog v-model="orderSuccess" persistent max-width="400">
      <v-card class="rounded-xl pa-8 text-center" elevation="4">
        <v-icon icon="mdi-check-circle" color="secondary" size="100" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold mb-4">Order Placed!</h2>
        <p class="text-body-1 text-grey mb-8">Your order has been received and is being processed. Thank you for shopping with FGXMART!</p>
        <v-btn color="primary" block size="large" rounded="lg" to="/" class="text-none font-weight-bold">
          Continue Shopping
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import logoImg from "~/assets/images/brand/fgx-logo.png"
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useAddressStore } from '~/stores/address'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const addressStore = useAddressStore()
const config = useRuntimeConfig()

const addressLoading = ref(false)
const showAddressForm = ref(false)
const editingAddressId = ref(null)
const countries = ref([])
const deliveryOption = ref('standard')
const placingOrder = ref(false)
const orderSuccess = ref(false)
const lastOrderNumber = ref('')
const companyInfo = ref(null)
const primaryBank = ref(null)

const addressForm = ref({
  name: '',
  phone_number: '',
  type: 'Home',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  country_id: null,
  zipcode: '',
  is_default: false
})

// Methods removed as payment is now Wire Transfer only

onMounted(async () => {
    // Redirect if cart is empty
    if (cart.isEmpty) {
        router.push('/cart')
        return
    }

    // Load initial data
    await addressStore.fetchAddresses()
    if ((addressStore.addresses?.length || 0) === 0) {
        showAddressForm.value = true
    }

    // Fetch Countries
    try {
        const { data } = await $fetch(`${config.public.apiBase}/countries`)
        countries.value = data || []
        if (countries.value.length > 0) {
            addressForm.value.country_id = countries.value[0].id
        }
    } catch (err) {
        console.error('Error fetching countries:', err)
    }

    // Fetch Company Info
    try {
        const res = await $fetch(`${config.public.apiBase}/company-info`)
        if (res.status === 'success') {
            companyInfo.value = res.data.company
            primaryBank.value = res.data.bank
        }
    } catch (err) {
        console.error('Error fetching company info:', err)
    }
})

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/100'
  if (path.startsWith('http')) return path
  return `${config.public.apiBase.replace('/api/v1', '')}/storage/${path}`
}

const resetAddressForm = () => {
    addressForm.value = {
        name: auth.user?.name || '',
        phone_number: '',
        type: 'Home',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country_id: countries.value[0]?.id || null,
        zipcode: '',
        is_default: addressStore.addresses.length === 0
    }
}

const editAddress = (address) => {
    editingAddressId.value = address.id
    addressForm.value = { ...address }
    showAddressForm.value = true
}

const saveAddress = async () => {
    addressLoading.value = true
    try {
        if (editingAddressId.value) {
            await addressStore.updateAddress(editingAddressId.value, addressForm.value)
        } else {
            await addressStore.addAddress(addressForm.value)
        }
        showAddressForm.value = false
        editingAddressId.value = null
    } catch (err) {
        console.error('Error saving address:', err)
    } finally {
        addressLoading.value = false
    }
}

const placeOrder = async () => {
    if (!addressStore.selectedAddressId) {
        alert('Please select a delivery address')
        return
    }

    placingOrder.value = true
    try {
        const res = await $fetch(`${config.public.apiBase}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Accept': 'application/json'
            },
            body: {
                address_id: addressStore.selectedAddressId,
                notes: ''
            }
        })

        if (res.status === 'success') {
            lastOrderNumber.value = res.data.order_number
            orderSuccess.value = true
            cart.fetchCart() // Refresh cart state (should be empty)
            
            // Redirect to success page
            router.push(`/order-success?id=${res.data.order_number}`)
        }
    } catch (err) {
        console.error('Error placing order:', err)
        alert('Failed to place order. Please try again.')
    } finally {
        placingOrder.value = false
    }
}

const downloadInvoice = async () => {
    const doc = new jsPDF()
    const company = companyInfo.value || {
        name: "FGXMART Global Trading LLC",
        address_line_1: "Office 123, Business Tower",
        city: "Dubai",
        state: "UAE",
        contact_email: "info@fgxmart.com",
        phone_number: "+971 50 000 0000"
    }

    const foldAddress = (str) => {
        if (!str || str.length <= 50) return [str];
        // Find last comma between 40 and 50
        const segment = str.substring(40, 51);
        const commaIdx = segment.lastIndexOf(',');
        if (commaIdx !== -1) {
            const splitAt = 40 + commaIdx;
            return [str.substring(0, splitAt + 1).trim(), str.substring(splitAt + 1).trim()];
        }
        // Fallback: split at 50
        return [str.substring(0, 50).trim(), str.substring(50).trim()];
    }
    
    // Header - Logo Section
    let logo = logoImg
    if (companyInfo.value?.logo_path) {
        try {
            const logoUrl = getImageUrl(companyInfo.value.logo_path)
            logo = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = logoUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => resolve(logoImg);
            });
        } catch (e) {
            console.error('Logo loading failed', e)
        }
    }

    doc.addImage(logo, 'PNG', 20, 15, 45, 15)
    
    // Company Details (Right side)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont(undefined, 'normal')
    
    doc.text(company.name, 190, 20, { align: 'right' })
    let compY = 25
    foldAddress(company.address_line_1).forEach(line => {
        doc.text(line, 190, compY, { align: 'right' })
        compY += 5
    })
    
    if (company.address_line_2) {
        foldAddress(company.address_line_2).forEach(line => {
            doc.text(line, 190, compY, { align: 'right' })
            compY += 5
        })
    }
    
    doc.text(`${company.city}, ${company.state}`, 190, compY, { align: 'right' })
    doc.text(`Email: ${company.contact_email}`, 190, compY + 5, { align: 'right' })
    doc.text(`Phone: ${company.phone_number}`, 190, compY + 10, { align: 'right' })
    
    // Divider
    doc.setDrawColor(230)
    doc.line(20, 50, 190, 50)
    
    // Invoice Title & Info
    doc.setFontSize(18)
    doc.setTextColor(0)
    doc.setFont(undefined, 'bold')
    doc.text("PROFORMA INVOICE", 20, 65)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 72)
    const displayOrderNum = lastOrderNumber.value ? `#${lastOrderNumber.value}` : `#FGX-${Math.floor(Math.random() * 100000)}`
    doc.text(`Order Ref: ${displayOrderNum}`, 20, 77)

    // Billing To (Optional but good)
    if (addressStore.selectedAddressId) {
        const addr = addressStore.addresses.find(a => a.id === addressStore.selectedAddressId)
        if (addr) {
            doc.setFont(undefined, 'bold')
            doc.text("BILL TO:", 20, 90)
            doc.setFont(undefined, 'normal')
            doc.text(addr.name, 20, 95)
            let currentY = 100
            foldAddress(addr.address_line_1).forEach(line => {
                doc.text(line, 20, currentY)
                currentY += 5
            })
            
            if (addr.address_line_2) {
                foldAddress(addr.address_line_2).forEach(line => {
                    doc.text(line, 20, currentY)
                    currentY += 5
                })
            }
            
            doc.text(`${addr.city}, ${addr.state} ${addr.zipcode}`, 20, currentY)
            if (addr.country?.name) {
                currentY += 5
                doc.text(addr.country.name, 20, currentY)
            }
        }
    }

    // Items Table
    const tableData = cart.items.map(item => {
        const unitPrice = Number(item.product.discount_price || item.product.price || 0)
        return [
            item.product.name,
            item.quantity,
            `$${unitPrice.toFixed(2)}`,
            `$${(unitPrice * item.quantity).toFixed(2)}`
        ]
    })

    autoTable(doc, {
        startY: 115,
        head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 75, 76], fontSize: 10 },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
    })

    // Summary - Totals
    const finalY = doc.lastAutoTable.finalY + 15
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont(undefined, 'normal')
    doc.text(`Subtotal:`, 135, finalY)
    doc.text(`$${cart.totalPrice.toFixed(2)}`, 190, finalY, { align: 'right' })
    
    doc.text(`Shipping Charge:`, 135, finalY + 7)
    doc.text(`$0.00`, 190, finalY + 7, { align: 'right' })
    
    doc.text(`Estimated Tax:`, 135, finalY + 14)
    doc.text(`$0.00`, 190, finalY + 14, { align: 'right' })
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(14, 75, 76)
    doc.text(`Total Payable (USD):`, 125, finalY + 25)
    doc.text(`$${cart.totalPrice.toFixed(2)}`, 190, finalY + 25, { align: 'right' })

    // Footer - Payment Notice
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(14, 75, 76)
    doc.text("BANKING DETAILS FOR TRANSFER", 20, 250)
    doc.setDrawColor(14, 75, 76)
    doc.line(20, 252, 85, 252)

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0)

    if (primaryBank.value) {
        const bank = primaryBank.value
        doc.setFont(undefined, 'bold')
        doc.text("Bank Name:", 20, 260)
        doc.setFont(undefined, 'normal')
        doc.text(bank.bank_name, 50, 260)

        doc.setFont(undefined, 'bold')
        doc.text("Account Name:", 20, 265)
        doc.setFont(undefined, 'normal')
        doc.text(bank.account_name, 50, 265)

        doc.setFont(undefined, 'bold')
        doc.text("Account No:", 20, 270)
        doc.setFont(undefined, 'normal')
        doc.text(bank.account_number, 50, 270)

        if (bank.swift_iban) {
            doc.setFont(undefined, 'bold')
            doc.text("SWIFT/IBAN:", 20, 275)
            doc.setFont(undefined, 'normal')
            doc.text(bank.swift_iban, 50, 275)
        }
    } else {
        doc.text("Please complete the wire transfer to the account listed on the FGX Store checkout page.", 20, 260)
    }
    
    doc.setTextColor(100)
    doc.setFontSize(8)
    doc.text("Note: Kindly send the transfer receipt to our support team via WhatsApp or Email.", 20, 282)
    
    doc.setFontSize(8)
    doc.text("This is a computer-generated proforma invoice and does not require a physical signature.", 20, 285)

    doc.save(`proforma-invoice-mart-${Date.now()}.pdf`)
}
</script>

<style scoped>
.checkout-page {
  background-color: #f8fafc;
}

.step-icon {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #eee;
}

.address-card {
  transition: all 0.3s ease;
}

.address-card:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.sticky-summary {
  position: sticky;
  top: 100px;
}

.lh-1 {
  line-height: 1.2;
}

.gap-4 {
  gap: 16px;
}

.transition-colors {
  transition: all 0.2s ease;
}

:deep(.v-radio-group .v-selection-control-group) {
    flex-direction: row;
}

.delivery-points .v-icon {
  font-size: 24px;
}

.account-details {
  border: 1px solid #eef2f6;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

.border-e-md {
  border-right: 1px solid #eee;
}

@media (max-width: 960px) {
  .border-e-md {
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-bottom: 2rem;
    margin-bottom: 2rem;
  }
}
</style>
