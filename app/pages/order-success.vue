<template>
  <div class="order-success-page py-12 bg-grey-lighten-4 min-h-screen">
    <v-container class="custom-container">
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-4 text-grey">Loading your order details...</p>
      </div>

      <div v-else-if="!order" class="text-center py-12">
        <v-icon icon="mdi-cart-off" size="100" color="grey-lighten-1" class="mb-6"></v-icon>
        <h1 class="text-h4 font-weight-black mb-4">No Recent Order Found</h1>
        <p class="text-body-1 text-grey mb-8">It seems you don't have any pending orders to view right now.</p>
        <v-btn color="primary" size="large" rounded="lg" to="/products" class="text-none font-weight-bold px-12">
          Continue Shopping
        </v-btn>
      </div>

      <v-row v-else justify="center">
        <v-col cols="12" lg="8">
          <v-card class="rounded-xl border pa-8 text-center mb-8" elevation="0">
            <v-icon icon="mdi-check-circle" color="secondary" size="80" class="mb-4"></v-icon>
            <h1 class="text-h3 font-weight-black mb-2">Thank you!</h1>
            <p v-if="route.query.download == '1'" class="text-h6 text-primary mb-6 animate-pulse">
              <v-icon icon="mdi-download" class="mr-2"></v-icon>
              Downloading your proforma invoice...
            </p>
            <p v-else class="text-h6 text-grey mb-6">Your order #{{ order.order_number }} has been placed successfully.</p>
            
            <div class="d-flex justify-center gap-4">
              <v-btn
                color="primary"
                variant="outlined"
                rounded="lg"
                prepend-icon="mdi-file-download-outline"
                class="text-none font-weight-bold"
                @click="downloadInvoice"
              >
                Download Proforma Invoice
              </v-btn>
              <v-btn
                color="secondary"
                rounded="lg"
                to="/products"
                class="text-none font-weight-bold"
              >
                Continue Shopping
              </v-btn>
            </div>
          </v-card>

          <v-row>
            <v-col cols="12" md="6">
              <v-card class="rounded-xl border pa-6 h-100" elevation="0">
                <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
                  <v-icon icon="mdi-map-marker" color="primary" class="mr-2"></v-icon>
                  Shipping Address
                </h3>
                <div class="text-body-1">
                  <p class="font-weight-bold mb-1">{{ order.shipping_address.name }}</p>
                  <p class="mb-0 text-grey-darken-1">{{ order.shipping_address.address_line_1 }}</p>
                  <p v-if="order.shipping_address.address_line_2" class="mb-0 text-grey-darken-1">{{ order.shipping_address.address_line_2 }}</p>
                  <p class="mb-0 text-grey-darken-1">{{ order.shipping_address.city }}, {{ order.shipping_address.state }} {{ order.shipping_address.zipcode }}</p>
                  <p class="mb-3 text-grey-darken-1">{{ order.shipping_address.country?.name }}</p>
                  <p class="text-body-2 font-weight-bold">Phone: {{ order.shipping_address.phone_number }}</p>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card class="rounded-xl border pa-6 h-100" elevation="0">
                <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
                  <v-icon icon="mdi-bank" color="primary" class="mr-2"></v-icon>
                  Payment Method
                </h3>
                <div class="bg-grey-lighten-4 rounded-lg pa-4">
                  <p class="text-caption text-uppercase font-weight-bold text-grey mb-1">Wire Transfer To:</p>
                  <p class="text-body-1 font-weight-bold mb-1">{{ order.bank_details?.bank_name }}</p>
                  <p class="text-body-2 text-grey-darken-2 mb-0">Acc: {{ order.bank_details?.account_name }}</p>
                  <p class="text-body-2 text-grey-darken-2 mb-0">No: {{ order.bank_details?.account_number }}</p>
                </div>
                <p class="text-caption text-grey mt-3">Please use <strong>#{{ order.order_number }}</strong> as your transfer reference.</p>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card class="rounded-xl border pa-6" elevation="0">
                <h3 class="text-h6 font-weight-bold mb-6">Order Summary</h3>
                <v-table density="comfortable">
                  <thead>
                    <tr>
                      <th class="text-left font-weight-bold">Product</th>
                      <th class="text-center font-weight-bold">Qty</th>
                      <th class="text-right font-weight-bold">Price</th>
                      <th class="text-right font-weight-bold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in order.items" :key="item.id">
                      <td>{{ item.product_name }}</td>
                      <td class="text-center">{{ item.quantity }}</td>
                      <td class="text-right">${{ Number(item.price).toFixed(2) }}</td>
                      <td class="text-right font-weight-bold">${{ Number(item.subtotal).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right font-weight-bold pt-4">Subtotal</td>
                      <td class="text-right pt-4">${{ Number(order.subtotal).toFixed(2) }}</td>
                    </tr>
                    <tr>
                      <td colspan="3" class="text-right font-weight-bold">Shipping</td>
                      <td class="text-right">${{ Number(order.shipping_charges).toFixed(2) }}</td>
                    </tr>
                    <tr>
                      <td colspan="3" class="text-right text-h6 font-weight-black border-0">Total Payable</td>
                      <td class="text-right text-h6 font-weight-black text-primary border-0">${{ Number(order.total_amount).toFixed(2) }}</td>
                    </tr>
                  </tfoot>
                </v-table>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import logoImg from "~/assets/images/brand/fgx-logo.png"

import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()
const order = ref(null)
const loading = ref(true)
const companyInfo = ref(null)

onMounted(async () => {
  const orderNumber = route.query.id
  if (!orderNumber) {
    loading.value = false
    return
  }

  try {
    // 1. Fetch Order Details
    let res;
    const hash = route.query.hash;

    if (hash) {
      // Use Public Endpoint (Guest Mode)
      res = await $fetch(`${config.public.apiBase}/orders/view/${orderNumber}?hash=${hash}`)
    } else {
      // Use Private Endpoint (Logged-in Mode)
      res = await $fetch(`${config.public.apiBase}/orders/${orderNumber}`, {
        headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json'
        }
      })
    }
    
    if (res.status === 'success') {
      order.value = res.data
      
      // Auto-trigger download if requested
      if (route.query.download == '1') {
        setTimeout(() => {
          downloadInvoice()
        }, 1500) // Small delay to ensure images/fonts are loaded
      }
    }

    // 2. Fetch Company Info (for PDF)
    const compRes = await $fetch(`${config.public.apiBase}/company-info`)
    if (compRes.status === 'success') {
      companyInfo.value = compRes.data.company
    }
  } catch (err) {
    console.error('Error loading order success page:', err)
  } finally {
    loading.value = false
  }
})

const getImageUrl = (path) => {
  if (!path) return null
  return `${config.public.apiBase.replace('/api/v1', '')}/storage/${path}`
}

const foldAddress = (str) => {
    if (!str || str.length <= 50) return [str];
    const segment = str.substring(40, 51);
    const commaIdx = segment.lastIndexOf(',');
    if (commaIdx !== -1) {
        const splitAt = 40 + commaIdx;
        return [str.substring(0, splitAt + 1).trim(), str.substring(splitAt + 1).trim()];
    }
    return [str.substring(0, 50).trim(), str.substring(50).trim()];
}

const downloadInvoice = async () => {
    if (!order.value) return
    const doc = new jsPDF()
    const item = order.value
    
    // Reuse the same logic as checkout for professional consistency
    const company = companyInfo.value || {
        name: "FGXMART Global Trading LLC",
        address_line_1: "Office 123, Business Tower",
        city: "Dubai",
        state: "UAE",
        contact_email: "info@fgxmart.com",
        phone_number: "+971 50 000 0000"
    }
    
    // Logo loading logic (same as checkout)
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
        } catch (e) {}
    }

    doc.addImage(logo, 'PNG', 20, 15, 45, 15)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(company.name, 190, 20, { align: 'right' })
    let compY = 25
    foldAddress(company.address_line_1).forEach(line => {
        doc.text(line, 190, compY, { align: 'right' })
        compY += 5
    })
    doc.text(`${company.city}, ${company.state}`, 190, compY, { align: 'right' })

    doc.setDrawColor(230)
    doc.line(20, 50, 190, 50)
    
    doc.setFontSize(18)
    doc.setTextColor(0)
    doc.setFont(undefined, 'bold')
    doc.text("PROFORMA INVOICE", 20, 65)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date(item.created_at).toLocaleDateString()}`, 20, 72)
    doc.text(`Order Ref: #${item.order_number}`, 20, 77)

    // Bill To
    doc.setFont(undefined, 'bold')
    doc.text("BILL TO:", 20, 90)
    doc.setFont(undefined, 'normal')
    doc.text(item.shipping_address.name, 20, 95)
    doc.text(item.shipping_address.address_line_1, 20, 100)
    if (item.shipping_address.address_line_2) {
      doc.text(item.shipping_address.address_line_2, 20, 105)
      doc.text(`${item.shipping_address.city}, ${item.shipping_address.state}`, 20, 110)
    } else {
      doc.text(`${item.shipping_address.city}, ${item.shipping_address.state}`, 20, 105)
    }

    // Table
    const tableData = item.items.map(i => [i.product_name, i.quantity, `$${Number(i.price).toFixed(2)}`, `$${Number(i.subtotal).toFixed(2)}`]);
    autoTable(doc, {
        startY: 120,
        head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 75, 76] }
    })

    const finalY = doc.lastAutoTable.finalY + 15
    doc.text(`Subtotal: $${Number(item.subtotal).toFixed(2)}`, 190, finalY, { align: 'right' })
    doc.text(`Total Payable: $${Number(item.total_amount).toFixed(2)}`, 190, finalY + 10, { align: 'right' })

    // Bank Details
    if (item.bank_details) {
      doc.setFont(undefined, 'bold')
      doc.text("BANKING DETAILS:", 20, 240)
      doc.setFont(undefined, 'normal')
      doc.text(`Bank: ${item.bank_details.bank_name}`, 20, 245)
      doc.text(`Acc: ${item.bank_details.account_name}`, 20, 250)
      doc.text(`No: ${item.bank_details.account_number}`, 20, 255)
    }

    doc.save(`invoice-${item.order_number}.pdf`)
}
</script>

<style scoped>
.order-success-page {
  background-color: #f8fafc;
}
.gap-4 { gap: 1rem; }
</style>
