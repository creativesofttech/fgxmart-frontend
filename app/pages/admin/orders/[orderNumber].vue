<template>
  <div class="order-detail-page">
    <div v-if="loading" class="loading-state h-[60vh] d-flex flex-column align-center tw:justify-center">
       <div class="loader-main tw:mb-4"></div>
       <p class="tw:text-base-content/60 tw:font-medium tw:animate-pulse">Retrieving order details...</p>
    </div>
    <template v-else-if="order">
      <!-- Top Navigation & Actions -->
      <div class="page-header tw:mb-10">
        <div class="header-left">
           <NuxtLink to="/admin/orders" class="back-btn tw:mr-6">
              <ArrowLeft size="20" />
           </NuxtLink>
           <div>
              <h1 class="tw:text-3xl tw:font-black tw:text-base-content tw:tracking-tight">Order #{{ order.order_number }}</h1>
              <p class="tw:text-sm tw:text-base-content/60 tw:mt-1 d-flex align-center">
                 <Calendar size="14" class="tw:mr-1.5" /> Placed on {{ formatDate(order.created_at) }}
              </p>
           </div>
        </div>
        <div class="header-right d-flex tw:gap-4">
           <button class="btn-secondary tw:btn tw:btn-sm tw:btn-outline" @click="editOrder">
              <Edit3 size="18" class="tw:mr-2" /> Update Status
           </button>
           <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="printOrder">
              <Printer size="18" class="tw:mr-2" /> Print Invoice
           </button>
        </div>
      </div>
      <!-- Overview Cards Grid -->
      <div class="info-grid tw:mb-12">
        <!-- Status Overview Card -->
        <div class="stats-card">
          <div class="icon-box bg-orange-500/10 text-orange-500">
            <Clock size="22" />
          </div>
          <div class="card-body">
             <h4 class="card-label">Status Summary</h4>
             <div class="tw:mt-4 space-y-4">
                <div class="d-flex tw:justify-space-between align-center tw:mb-4">
                   <span class="tw:text-xs tw:text-base-content/60 tw:font-bold tw:uppercase tw:tracking-wider">Order Status</span>
                   <span :class="['status-badge', order.status]">
                      <span class="dot"></span> {{ order.status }}
                   </span>
                </div>
                <div class="d-flex tw:justify-space-between align-center">
                   <span class="tw:text-xs tw:text-base-content/60 tw:font-bold tw:uppercase tw:tracking-wider">Payment Status</span>
                   <span :class="['payment-badge', order.payment_status]">{{ order.payment_status }}</span>
                </div>
             </div>
          </div>
        </div>
        <!-- Customer Profile Card -->
        <div class="stats-card">
          <div class="icon-box bg-green-500/10 text-green-500">
            <User size="22" />
          </div>
          <div class="card-body">
             <h4 class="card-label">Customer Profile</h4>
             <div class="tw:mt-4">
                <p class="tw:text-base-content tw:font-black tw:text-lg tw:mb-4">{{ order.shipping_address?.name || order.user?.name }}</p>
                <div class="contact-strip space-y-2">
                   <div class="d-flex align-center tw:text-sm tw:text-base-content/60">
                      <Mail size="14" class="tw:mr-3 opacity-50 tw:mr-2" /> {{ order.user?.email }}
                   </div>
                   <div class="d-flex align-center tw:text-sm tw:text-base-content/60">
                      <Phone size="14" class="tw:mr-3 opacity-50 tw:mr-2" /> {{ order.shipping_address?.phone_number || 'N/A' }}
                   </div>
                   <div class="d-flex align-start tw:text-sm tw:text-base-content/60">
                      <MapPin size="14" class="tw:mr-3 tw:mt-0.5 opacity-50 tw:mr-2" />
                      <span>{{ order.shipping_address?.address_line_1 }}, {{ order.shipping_address?.city }}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
        <!-- Financial Summary Card -->
        <div class="stats-card financial-card">
          <div class="icon-box bg-blue-500/10 text-blue-500">
            <TrendingUp size="22" />
          </div>
          <div class="card-body">
             <h4 class="card-label">Financial Summary</h4>
             <div class="contact-strip tw:mt-4 space-y-3">
                <div class="d-flex tw:justify-space-between tw:text-sm">
                   <span class="tw:text-base-content/60">Subtotal</span>
                   <span class="tw:text-base-content tw:font-semibold">${{ Number(order.subtotal || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex tw:justify-space-between tw:text-sm tw:pb-3 tw:border-b border-slate-700/50">
                   <span class="tw:text-base-content/60">Shipping</span>
                   <span class="tw:text-base-content tw:font-semibold">${{ Number(order.shipping_charges || 0).toFixed(2) }}</span>
                </div>
                <div class="d-flex tw:justify-space-between align-center tw:pt-2">
                   <span class="tw:text-lg tw:font-black tw:text-base-content">Grand Total</span>
                   <span class="tw:text-3xl tw:font-black text-blue-500 tw:tracking-tighter">${{ Number(order.total_amount).toFixed(2) }}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      <!-- Items & Activity Split -->
      <div class="main-sections-grid">
         <!-- Items Section -->
         <div class="section-container">
            <div class="section-header tw:mb-6">
               <div class="header-indicator bg-blue-500"></div>
               <h3 class="tw:text-sm tw:font-black tw:uppercase tw:tracking-widest tw:text-base-content/60">Order Manifest ({{ order.items?.length }} Items)</h3>
            </div>
            <div class="table-card tw:overflow-hidden">
               <table class="manifest-table tw:table">
                  <thead>
                     <tr>
                        <th>Product Details</th>
                        <th class="text-center">Rate</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Total</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr v-for="item in order.items" :key="item.id">
                        <td>
                           <div class="tw:font-bold tw:text-base-content text-base">{{ item.product_name }}</div>
                           <div class="tw:text-[10px] tw:text-base-content/60 tw:font-black tw:uppercase tw:tracking-widest tw:mt-1">SKU: {{ item.product?.sku || 'N/A' }}</div>
                        </td>
                        <td class="text-center tw:text-base-content/60 tw:font-semibold">${{ Number(item.price).toFixed(2) }}</td>
                        <td class="text-center">
                           <span class="qty-badge">{{ item.quantity }}</span>
                        </td>
                        <td class="text-right tw:font-black tw:text-base-content tw:text-lg">${{ Number(item.subtotal).toFixed(2) }}</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
         <!-- Activity Logs -->
         <div class="section-container">
            <div class="section-header tw:mb-6">
               <div class="header-indicator bg-green-500"></div>
               <h3 class="tw:text-sm tw:font-black tw:uppercase tw:tracking-widest tw:text-base-content/60">Activity & Audit Timeline</h3>
            </div>
            <div class="timeline-container">
               <div v-if="!order.status_logs?.length" class="empty-timeline">
                  <History size="40" class="tw:text-base-content/60 tw:mb-2" />
                  <p>No activity recorded yet.</p>
               </div>
               <div v-for="log in order.status_logs" :key="log.id" class="timeline-log-card">
                  <div class="log-path">
                     <div class="path-dot"></div>
                     <div class="path-line"></div>
                  </div>
                  <div class="log-body">
                     <div class="d-flex tw:justify-space-between tw:mb-2">
                        <span class="log-type-tag">{{ log.type.replace('_', ' ') }} updated</span>
                        <span class="log-time">{{ formatDate(log.created_at) }}</span>
                     </div>
                     <p class="log-message">
                        Status drifted from <span class="old">{{ log.old_status }}</span> to <span class="new text-green-400">{{ log.new_status }}</span>
                     </p>
                     <div v-if="log.notes" class="log-notes tw:mt-3">
                        <div class="label">Admin Feedback</div>
                        <p>"{{ log.notes }}"</p>
                     </div>
                     <div class="log-footer d-flex align-center tw:mt-3">
                        <div class="avatar"><User size="10"/></div>
                        By: <span class="tw:text-base-content/60 tw:ml-1.5">{{ log.user?.name || 'System' }}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </template>
    <!-- Fallback if not found -->
    <div v-else class="error-state h-[60vh] d-flex flex-column align-center tw:justify-center">
       <XCircle size="64" class="text-red-500/50 tw:mb-4" />
       <h2 class="tw:text-2xl tw:font-bold tw:text-base-content tw:mb-2">Order Not Found</h2>
       <p class="tw:text-base-content/60 tw:mb-6">The order reference you are looking for does not exist.</p>
       <NuxtLink to="/admin/orders" class="btn-primary tw:btn tw:btn-sm tw:btn-primary">Return to Orders</NuxtLink>
    </div>
    <!-- Edit Modal (Re-using logic) -->
    <Modal v-model="showEditModal" title="Update Order Status" width="560px" :close-disabled="updating"><div class="form-group tw:mb-6">
              <label class="premium-label tw:mb-4 block">Order Lifecycle</label>
              <AppSelect v-model="editForm.status" :options="orderStatusOptions.map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))" aria-label="Order Status" :allow-empty="false" :searchable="false" />
            </div><div class="form-group tw:mb-6">
              <label class="premium-label tw:mb-4 block">Payment Status</label>
              <AppSelect v-model="editForm.payment_status" :options="paymentStatusOptions.map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))" aria-label="Payment Status" :allow-empty="false" :searchable="false" />
            </div><div class="form-group tw:mb-12">
              <label class="premium-label tw:mb-4 block">Adjustment Notes</label>
              <div class="textarea-wrapper">
                 <textarea v-model="editForm.notes" class="premium-textarea tw:textarea" placeholder="Why is this change being made?" rows="3"></textarea>
              </div>
            </div><div class="tw:modal-action modal-actions tw:gap-6 tw:mt-6">
              <button class="btn-cancel tw:btn tw:btn-sm tw:btn-ghost" @click="showEditModal = false">Cancel</button>
              <button class="btn-primary tw:flex-1 tw:btn tw:btn-sm tw:btn-primary" :disabled="updating" @click="updateStatus">
                <span v-if="updating">Updating...</span>
                <span v-else>Apply Changes</span>
              </button>
            </div></Modal>
  </div>
</template>
<script setup>
import Modal from '~/components/admin/ui/Modal.vue'
definePageMeta({ layout: "admin" })
import {
  ArrowLeft, Clock, User, TrendingUp, Mail,
  Phone, MapPin, Calendar, History, Printer,
  Edit3, XCircle, X, ChevronDown
} from 'lucide-vue-next'
import { $adminApi } from '~/composables/useAdminApi'
import { useAdminToast } from '~/composables/useAdminToast'
const route = useRoute()
const toast = useAdminToast()
const order = ref(null)
const loading = ref(true)
const updating = ref(false)
const showEditModal = ref(false)
const editForm = ref({ status: '', payment_status: '', notes: '' })
const orderStatusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatusOptions = ['unpaid', 'paid', 'refunded']
const fetchOrderDetails = async () => {
  loading.value = true
  try {
    const response = await $adminApi(`/orders/${route.params.orderNumber}`)
    if (response.status === 'success') {
      order.value = response.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
const editOrder = () => {
  editForm.value = {
    status: order.value.status,
    payment_status: order.value.payment_status,
    notes: ''
  }
  showEditModal.value = true
}
const updateStatus = async () => {
  updating.value = true
  try {
    const response = await $adminApi(`/orders/${order.value.order_number}/status`, {
      method: 'PUT',
      body: editForm.value
    })
    if (response.status === 'success') {
      toast.success('Order status updated')
      showEditModal.value = false
      await fetchOrderDetails()
    }
  } catch (e) {
    toast.error('Failed to update status')
  } finally {
    updating.value = false
  }
}
const printOrder = () => {
  window.print();
}
const formatDate = (dateString) => {
  if (!dateString) return '---'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
onMounted(() => {
  fetchOrderDetails()
})
</script>
<style scoped>
.order-detail-page {
  padding: 1rem;
  font-family: var(--app-font-family);
}
.order-detail-page .mb-4 {
  margin-bottom: 1rem;
}
.order-detail-page .contact-strip {
  display: grid;
  gap: 1rem;
}
.order-detail-page .mr-2 {
  margin-right: 0.5rem;
}
.order-detail-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-detail-page .page-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.order-detail-page .page-header .header-right {
  gap: 10px;
  display: flex;
  align-items: center;
}
.order-detail-page .page-header .back-btn {
  width: 48px;
  height: 48px;
  border-radius: 1.25rem;
  background: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  color: var(--color-base-content);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.order-detail-page .page-header .back-btn:hover {
  background: var(--color-base-300);
  transform: scale(1.1);
}
.order-detail-page .info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
.order-detail-page .d-flex {
  display: flex;
}
.order-detail-page .justify-space-between {
  justify-content: space-between;
}
.order-detail-page .align-center {
  align-items: center;
}
.order-detail-page .stats-card {
  background: var(--color-base-100);
  border-radius: 12px;
  padding: 15px 20px;
  border: 1px solid rgb(71 37 128 / 10%);
  position: relative;
  transition: transform 0.3s;
}
.order-detail-page .stats-card:hover {
  transform: translateY(-5px);
}
.order-detail-page .stats-card .icon-box {
  width: 54px;
  height: 54px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.order-detail-page .stats-card .card-label {
  font-size: 11px;
  font-weight: 900;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
.order-detail-page .stats-card.financial-card {
  background: linear-gradient(135deg, var(--color-base-100) 0%, var(--color-base-200) 100%);
  border-color: rgba(59, 130, 246, 0.2);
}
.order-detail-page .main-sections-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
}
@media (max-width: 1200px) {
  .order-detail-page .main-sections-grid {
    grid-template-columns: 1fr;
  }
}
.order-detail-page .header-indicator {
  width: 5px;
  height: 18px;
  border-radius: 10px;
  margin-right: 15px;
  display: inline-block;
  vertical-align: middle;
}
.order-detail-page .manifest-table {
  width: 100%;
}
.order-detail-page .manifest-table th {
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.order-detail-page .manifest-table td {
}
.order-detail-page .manifest-table .qty-badge {
}
.order-detail-page .timeline-container .timeline-log-card {
  display: flex;
  gap: 2rem;
  margin-bottom: 2.5rem;
}
.order-detail-page .timeline-container .timeline-log-card .path-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  position: relative;
  z-index: 2;
  box-shadow: 0 0 0 6px var(--color-base-100), 0 0 20px var(--color-primary);
  margin-top: 32px;
}
.order-detail-page .timeline-container .timeline-log-card .path-line {
  width: 1px;
  background: rgb(71 37 128 / 10%);
  margin-left: 5.5px;
  flex: 1;
}
.order-detail-page .timeline-container .timeline-log-card .log-body {
  flex: 1;
  background: rgba(15, 23, 42, 0.3);
  padding: 2.5rem;
  border-radius: 2.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-type-tag {
  font-size: 9px;
  font-weight: 1000;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-time {
  font-size: 11px;
  font-weight: 700;
  color: #52525b;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-base-content);
  margin-top: 1rem;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-message .old {
  color: #52525b;
  text-decoration: line-through;
  margin-right: 0.5rem;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-notes {
  border-left: 4px solid var(--color-primary);
  background: rgba(15, 23, 42, 0.6);
  padding: 1.5rem;
  border-radius: 0 2rem 2rem 2rem;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-notes .label {
  font-size: 9px;
  font-weight: 1000;
  color: #52525b;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-notes p {
  font-size: 0.95rem;
  color: #a1a1aa;
  font-style: italic;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-footer {
  font-size: 11px;
  font-weight: 800;
  color: #52525b;
}
.order-detail-page .timeline-container .timeline-log-card .log-body .log-footer .avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-base-300);
  display: flex;
  align-items: center;
  justify-content: center;
}
.order-detail-page .btn-primary {
  transition: all 0.2s;
}
.order-detail-page .btn-primary:hover {
  transform: translateY(-2px);
}
.order-detail-page .btn-secondary {
  transition: all 0.2s;
}
.order-detail-page .btn-secondary:hover {
}
.order-detail-page {
  /* Shared Modals */
}
.order-detail-page {
  /* Status and Payment Badges */
}
.order-detail-page .status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 3rem;
  font-size: 10px;
  font-weight: 1000;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.order-detail-page .status-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 12px;
}
.order-detail-page .status-badge.pending {
  background: rgba(245, 158, 11, 0.0823529412);
  color: #f59e0b;
}
.order-detail-page .status-badge.pending .dot {
  background: #f59e0b;
}
.order-detail-page .status-badge.confirmed {
  background: rgba(59, 130, 246, 0.0823529412);
  color: var(--color-primary);
}
.order-detail-page .status-badge.confirmed .dot {
  background: var(--color-primary);
}
.order-detail-page .status-badge.processing {
  background: rgba(168, 85, 247, 0.0823529412);
  color: #a855f7;
}
.order-detail-page .status-badge.processing .dot {
  background: #a855f7;
}
.order-detail-page .status-badge.shipped {
  background: rgba(129, 140, 248, 0.0823529412);
  color: #818cf8;
}
.order-detail-page .status-badge.shipped .dot {
  background: #818cf8;
}
.order-detail-page .status-badge.delivered {
  background: rgba(16, 185, 129, 0.0823529412);
  color: #10b981;
}
.order-detail-page .status-badge.delivered .dot {
  background: #10b981;
}
.order-detail-page .status-badge.cancelled {
  background: rgba(239, 68, 68, 0.0823529412);
  color: #ef4444;
}
.order-detail-page .status-badge.cancelled .dot {
  background: #ef4444;
}
.order-detail-page .payment-badge {
  padding: 0.5rem 1.25rem;
  border-radius: 1rem;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.order-detail-page .payment-badge.unpaid {
  border: 2px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}
.order-detail-page .payment-badge.paid {
  border: 2px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}
.order-detail-page .payment-badge.refunded {
  border: 2px solid rgba(113, 113, 122, 0.3);
  color: #71717a;
}
.order-detail-page .loader-main {
  border: 5px solid rgb(71 37 128 / 10%);
  border-radius: 50%;
  border-top: 5px solid var(--color-primary);
  width: 60px;
  height: 60px;
  animation: spin 1s infinite linear;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
