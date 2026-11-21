<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Products Management</h1>
      <NuxtLink to="/admin/products/create" class="btn-primary tw:btn tw:btn-sm tw:btn-primary">
        + Create Product
      </NuxtLink>
    </div>
    <div class="tw:card content-card">
      <div class="filters">
        <div class="search-box">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="search-input tw:input"
            @input="handleSearch"
          >
        </div>
      </div>
      <div v-if="loadError" class="products-load-error" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" class="tw:btn tw:btn-sm tw:btn-outline" @click="fetchProducts()">Try again</button>
      </div>
      <DataTable
        v-else
        :columns="columns"
        :data="products"
        :loading="loading"
        :pagination="pagination"
        :actions="true"
        @page-change="fetchProducts"
      >
        <template #cover_image="{ value, row }">
          <div class="product-img-wrapper">
            <img :src="value || '/placeholder-product.png'" :alt="row.name" class="product-img">
          </div>
        </template>
        <template #category="{ value }">
          <span v-if="value" class="category-badge">{{ value.name }}</span>
          <span v-else class="text-muted">No Category</span>
        </template>
        <template #brand="{ value }">
          <span v-if="value" class="brand-badge">{{ value.name }}</span>
          <span v-else class="text-muted">No Brand</span>
        </template>
        <template #price="{ value, row }">
          <div class="price-info">
            <span class="base-price" :class="{ 'has-discount': row.discount_price }">
              ${{ value }}
            </span>
            <span v-if="row.discount_price" class="discount-price">
              ${{ row.discount_price }}
            </span>
          </div>
        </template>
        <template #status="{ value }">
          <span class="tw:badge badge" :class="value ? 'active' : 'inactive'">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="actions">
            <NuxtLink :to="`/admin/products/${row.id}/edit`" class="btn-icon edit tw:btn tw:btn-sm tw:btn-ghost" title="Edit">
              <Edit2 class="icon" />
            </NuxtLink>
            <button class="btn-icon delete tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="confirmDelete(row)" title="Delete">
              <Trash2 class="icon" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Product"
      :message="`Are you sure you want to delete product '${itemToDelete?.name}'? This action cannot be undone.`"
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, onMounted } from 'vue'
import DataTable from '~/components/admin/ui/DataTable.vue'
import ConfirmModal from '~/components/admin/ui/ConfirmModal.vue'
import { Edit2, Trash2, Search } from 'lucide-vue-next'
import { useAdminToast } from '~/composables/useAdminToast'
import { debounce } from 'lodash-es'
const { success, error: toastError } = useAdminToast()
const products = ref([])
const loading = ref(true)
const pagination = ref(null)
const searchQuery = ref('')
const loadError = ref('')
// Modal State
const showDeleteModal = ref(false)
const deleting = ref(false)
const itemToDelete = ref(null)
const columns = [
  { key: 'cover_image_url', label: 'Image', width: '10%', slot: 'cover_image' },
  { key: 'name', label: 'Product Name', width: '25%' },
  { key: 'category', label: 'Category', width: '15%', slot: 'category' },
  { key: 'brand', label: 'Brand', width: '15%', slot: 'brand' },
  { key: 'base_price', label: 'Price', width: '15%', slot: 'price' },
  { key: 'stock_quantity', label: 'Stock', width: '10%' },
  { key: 'status', label: 'Status', width: '15%', slot: 'status' }
]
const fetchProducts = async (page = 1) => {
  loading.value = true
  loadError.value = ''
  try {
    const query = new URLSearchParams({ page: String(page) })
    const search = searchQuery.value.trim()
    if (search) query.set('search', search)
    const data = await $adminApi(`/products?${query}`)
    if (data) {
      products.value = [...data.data]
      pagination.value = {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to
      }
    }
  } catch (err) {
    console.error('Failed to fetch products:', err)
    loadError.value = 'We couldn’t load your products. Please try again.'
  } finally {
    loading.value = false
  }
}
const handleSearch = debounce(() => {
  fetchProducts(1)
}, 500)
const confirmDelete = (row) => {
  itemToDelete.value = row
  showDeleteModal.value = true
}
const handleDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    const { error: apiErr } = await useAdminApi(`/products/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })
    if (apiErr.value) {
        toastError(apiErr.value.data?.message || 'Failed to delete product')
        return
    }
    success('Product deleted successfully')
    showDeleteModal.value = false
    await fetchProducts(pagination.value?.current_page || 1)
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}
onMounted(() => {
  fetchProducts()
})
</script>
<style scoped>
.products-load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  color: #9c3248;
}
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-base-content);
  margin: 0;
}

.content-card {
  background-color: var(--color-base-100);
  border-radius: 0.5rem;
  border: 1px solid rgb(71 37 128 / 10%);
  overflow: visible;
}

.filters {
  padding: 1rem;
  border-bottom: 1px solid rgb(71 37 128 / 10%);
}
.filters .search-box {
  position: relative;
  max-width: 300px;
}
.filters .search-box .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #64748b;
}
.filters .search-box .search-input {
  width: 100%;
}
.filters .search-box .search-input:focus {
}

.product-img-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--color-base-200);
}
.product-img-wrapper .product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  background-color: rgba(148, 163, 184, 0.1);
  color: #80718d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.price-info .base-price {
  font-weight: 600;
  color: var(--color-base-content);
}
.price-info .base-price.has-discount {
  text-decoration: line-through;
  color: #64748b;
  font-size: 0.8rem;
}
.price-info .discount-price {
  color: #22c55e;
  font-weight: 700;
}

.badge {
  text-transform: uppercase;
}
.badge.active {
}
.badge.inactive {
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover {
}
.btn-icon.edit:hover {
}
.btn-icon.delete:hover {
}
.btn-icon .icon {
  width: 16px;
}

.btn-primary {
  text-decoration: none;
  transition: background-color 0.2s;
}
.btn-primary:hover {
}

.text-muted {
  color: #64748b;
  font-style: italic;
  font-size: 0.8rem;
}
</style>
