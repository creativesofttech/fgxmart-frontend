<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Orders</h1>
        <p>Manage and track all customer orders</p>
      </div>
    </div>
    <!-- Stats Section -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="tw:card stat-card">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
          <component :is="stat.icon" />
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
      </div>
    </div>
    <div class="tw:card content-card">
      <div class="table-actions">
        <!-- Search -->
        <div class="search-box">
          <Search class="search-icon" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by order #, customer name..."
            class="search-input tw:input"
          >
        </div>

        <!-- Filter Dropdown -->
        <div class="filter-group">
          <select v-model="statusFilter" class="tw:select" aria-label="Filter orders by status"><option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
        </div>
      </div>
      <!-- Table -->
      <div class="table-container shadow-2xl tw:rounded-2xl tw:overflow-hidden">
        <table class="data-table tw:table">
          <thead>
            <tr>
              <th>Order Details</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center tw:py-20">
                <div class="loader"></div>
                <p class="tw:mt-4 tw:text-base-content/60 tw:font-medium tw:tracking-wide">Fetching orders...</p>
              </td>
            </tr>
            <tr v-else-if="filteredOrders.length === 0">
              <td colspan="7" class="text-center tw:py-20">
                <div class="empty-state">
                  <ShoppingBag class="tw:w-12 tw:h-12 tw:text-base-content/60 tw:mb-4" />
                  <p class="tw:text-base-content/60 tw:font-medium">No orders found matching your criteria.</p>
                </div>
              </td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id" class="table-row">
              <td @click="viewOrder(order)" class="cursor-pointer">
                <div class="order-ref">
                  <span class="order-num">{{ order.order_number }}</span>
                  <span class="order-date">{{ formatDate(order.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="customer-info">
                  <span class="customer-name">{{ order.shipping_address?.name || order.user?.name }}</span>
                  <span class="customer-email">{{ order.user?.email }}</span>
                </div>
              </td>
              <td>
                <div class="tw:items-badge">
                  {{ order.items?.length || 0 }} Items
                </div>
              </td>
              <td>
                <span class="amount">${{ Number(order.total_amount).toFixed(2) }}</span>
              </td>
              <td>
                <span :class="['status-badge', order.status]">
                   <span class="dot"></span>
                   {{ order.status }}
                </span>
              </td>
              <td>
                <span :class="['payment-badge', order.payment_status]">
                  {{ order.payment_status }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-btn view tw:btn tw:btn-sm tw:btn-ghost" title="View Detail Page" @click="viewOrder(order)">
                    <Eye />
                  </button>
                  <button class="action-btn edit tw:btn tw:btn-sm tw:btn-ghost" title="Quick Edit Status" @click="editOrder(order)">
                    <Edit2 />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Quick Edit Status Modal -->
    <Modal v-model="showEditModal" title="Update Order Status" width="560px" :close-disabled="updating"><!-- Order Status --><div class="form-group tw:mb-4">
              <label class="premium-label tw:mb-4 block">Order Lifecycle Status</label>
              <select v-model="editForm.status" class="tw:select" aria-label="Order Status"><option v-for="opt in orderStatusOptions" :key="opt" :value="opt">{{ opt }}</option></select>
            </div><!-- Payment Status --><div class="form-group tw:mb-4">
              <label class="premium-label tw:mb-4 block">Payment Workflow</label>
              <select v-model="editForm.payment_status" class="tw:select" aria-label="Payment Status"><option v-for="opt in paymentStatusOptions" :key="opt" :value="opt">{{ opt }}</option></select>
            </div><!-- Notes --><div class="form-group tw:mb-4">
              <label class="premium-label tw:mb-4 block">Internal Adjustment Notes <small class="tw:text-base-content/60 lowercase tw:ml-2">(Audit Visible)</small></label>
              <div class="textarea-wrapper">
                 <textarea
                  v-model="editForm.notes"
                  class="premium-textarea tw:textarea"
                  placeholder="Explain why this change is being made..."
                  rows="3"
                ></textarea>
              </div>
            </div><!-- Actions Row --><div class="tw:modal-action modal-actions tw:gap-6 tw:mt-4">
              <button class="btn-cancel tw:btn tw:btn-sm tw:btn-ghost" @click="showEditModal = false">Discard Changes</button>
              <button class="btn-save tw:btn tw:btn-sm tw:btn-primary" :disabled="updating" @click="updateOrderStatus">
                <span v-if="updating" class="d-flex align-center">
                   <div class="loader-small tw:mr-3"></div> Syncing...
                </span>
                <span v-else>Confirm & Update Order</span>
              </button>
            </div></Modal>
  </div>
</template>
<script setup>
import Modal from '~/components/admin/ui/Modal.vue'
definePageMeta({ layout: "admin" })
import { ref, computed, onMounted } from 'vue'
import {
  Search, Eye, Edit2, ShoppingBag, Clock,
  CheckCircle2, XCircle, TrendingUp, ChevronDown,
  X, History, FileText, Filter, User, Mail,
  MapPin, Phone, Edit3
} from 'lucide-vue-next'
import { $adminApi } from '~/composables/useAdminApi'
import { useAdminToast } from '~/composables/useAdminToast'
import { useRouter } from 'vue-router'
const router = useRouter()
const toast = useAdminToast()
const orders = ref([])
const loading = ref(true)
const updating = ref(false)
const search = ref('')
const statusFilter = ref('all')
const showEditModal = ref(false)
const selectedOrder = ref(null)
const editForm = ref({
  status: '',
  payment_status: '',
  notes: ''
})
const statusOptions = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
]
const orderStatusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatusOptions = ['unpaid', 'paid', 'refunded']
const stats = computed(() => {
  const total = orders.value.length
  const pending = orders.value.filter(o => o.status === 'pending').length
  const confirmed = orders.value.filter(o => o.status === 'confirmed' || o.status === 'processing').length
  const canceled = orders.value.filter(o => o.status === 'cancelled').length
  const revenue = orders.value.reduce((sum, o) => sum + Number(o.total_amount), 0)
  return [
    { label: 'Total Orders', value: total, icon: ShoppingBag, color: '#3b82f6' },
    { label: 'Pending Payment', value: pending, icon: Clock, color: '#f59e0b' },
    { label: 'Active Orders', value: confirmed, icon: CheckCircle2, color: '#10b981' },
    { label: 'Cancelled', value: canceled, icon: XCircle, color: '#ef4444' },
    { label: 'Total Revenue', value: '$' + revenue.toFixed(2), icon: TrendingUp, color: '#8b5cf6' }
  ]
})
const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await $adminApi('/orders')
    if (response.status === 'success') {
      orders.value = response.data
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}
const viewOrder = (order) => {
  router.push(`/admin/orders/${order.order_number}`)
}
const editOrder = (order) => {
  selectedOrder.value = { ...order }
  editForm.value = {
    status: order.status,
    payment_status: order.payment_status,
    notes: ''
  }
  showEditModal.value = true
}
const updateOrderStatus = async () => {
  updating.value = true
  try {
    const response = await $adminApi(`/orders/${selectedOrder.value.order_number}/status`, {
      method: 'PUT',
      body: editForm.value
    })

    if (response.status === 'success') {
      toast.success('Order status updated')
      showEditModal.value = false
      await fetchOrders()
    }
  } catch (e) {
    toast.error('Could not update status')
  } finally {
    updating.value = false
  }
}
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.value.toLowerCase()) ||
      (order.shipping_address?.name || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(search.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})
const formatDate = (dateString) => {
  if (!dateString) return '---'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
onMounted(() => {
  fetchOrders()
})
</script>
<style scoped>
.orders-page {
  font-family: "Inter", sans-serif;
}
.orders-page .mb-4 {
  margin-bottom: 1rem;
}
.orders-page .page-header {
  margin-bottom: 2.5rem;
}
.orders-page .page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-base-content);
  margin-bottom: 0.5rem;
}
.orders-page .page-header p {
  color: #71717a;
  font-weight: 500;
}
.orders-page .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.orders-page .stats-grid .stat-card {
  background: var(--color-base-100);
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid rgb(71 37 128 / 10%);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.orders-page .stats-grid .stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}
.orders-page .stats-grid .stat-card .stat-icon {
  width: 58px;
  height: 58px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.orders-page .stats-grid .stat-card .stat-icon svg {
  width: 28px;
  height: 28px;
}
.orders-page .stats-grid .stat-card .stat-info {
  display: flex;
  flex-direction: column;
}
.orders-page .stats-grid .stat-card .stat-info .stat-label {
  font-size: 0.815rem;
  font-weight: 700;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.orders-page .stats-grid .stat-card .stat-info .stat-value {
  font-size: 1.625rem;
  font-weight: 900;
  color: var(--color-base-content);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.orders-page .content-card {
  background: var(--color-base-100);
  border-radius: 1.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
  padding: 2rem;
}
.orders-page .table-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
}
.orders-page .table-actions .search-box {
  position: relative;
  flex: 1;
  max-width: 450px;
}
.orders-page .table-actions .search-box .search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
}
.orders-page .table-actions .search-box .search-input {
  width: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.orders-page .table-actions .search-box .search-input:focus {
}
.orders-page {
  /* Premium Custom Select Design */
}
.orders-page .table-container {
}
.orders-page .table-container .data-table {
  width: 100%;
}
.orders-page .table-container .data-table th {
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.orders-page .table-container .data-table .table-row {
  transition: all 0.2s;
}
.orders-page .table-container .data-table .table-row:hover {
}
.orders-page .table-container .data-table td {
  vertical-align: middle;
}
.orders-page .table-container .data-table .order-ref {
  display: flex;
  flex-direction: column;
}
.orders-page .table-container .data-table .order-ref .order-num {
}
.orders-page .table-container .data-table .order-ref .order-date {
  margin-top: 5px;
}
.orders-page .table-container .data-table .customer-info {
  display: flex;
  flex-direction: column;
}
.orders-page .table-container .data-table .customer-info .customer-name {
}
.orders-page .table-container .data-table .customer-info .customer-email {
}
.orders-page .table-container .data-table .items-badge {
  display: inline-block;
}
.orders-page .table-container .data-table .amount {
}
.orders-page .table-container .data-table .status-badge {
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.orders-page .table-container .data-table .status-badge .dot {
  width: 7px;
  margin-right: 12px;
}
.orders-page .table-container .data-table .status-badge.pending {
}
.orders-page .table-container .data-table .status-badge.pending .dot {
}
.orders-page .table-container .data-table .status-badge.confirmed {
}
.orders-page .table-container .data-table .status-badge.confirmed .dot {
}
.orders-page .table-container .data-table .status-badge.processing {
}
.orders-page .table-container .data-table .status-badge.processing .dot {
}
.orders-page .table-container .data-table .status-badge.shipped {
}
.orders-page .table-container .data-table .status-badge.shipped .dot {
}
.orders-page .table-container .data-table .status-badge.delivered {
}
.orders-page .table-container .data-table .status-badge.delivered .dot {
}
.orders-page .table-container .data-table .status-badge.cancelled {
}
.orders-page .table-container .data-table .status-badge.cancelled .dot {
}
.orders-page .table-container .data-table .payment-badge {
  display: inline-flex;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.orders-page .table-container .data-table .payment-badge.unpaid {
}
.orders-page .table-container .data-table .payment-badge.paid {
}
.orders-page .table-container .data-table .payment-badge.refunded {
}
.orders-page .table-container .data-table .actions {
  display: flex;
  gap: 0.85rem;
}
.orders-page .table-container .data-table .actions .action-btn {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.orders-page .table-container .data-table .actions .action-btn svg {
  width: 18px;
}
.orders-page .table-container .data-table .actions .action-btn:hover {
  transform: scale(1.1) rotate(5deg);
}
.orders-page .table-container .data-table .actions .action-btn:hover.view {
}
.orders-page .table-container .data-table .actions .action-btn:hover.edit {
}

/* Animations */

/* Loaders */
.loader {
  border: 5px solid rgb(71 37 128 / 10%);
  border-radius: 50%;
  border-top: 5px solid var(--color-primary);
  width: 50px;
  height: 50px;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.loader-small {
  border: 3px solid rgb(71 37 128 / 10%);
  border-radius: 50%;
  border-top: 3px solid var(--color-base-content);
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.capitalize {
  text-transform: capitalize;
}

.empty-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #52525b;
  font-weight: 700;
  text-align: center;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(71 37 128 / 10%);
  border-radius: 20px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(71 37 128 / 10%);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
