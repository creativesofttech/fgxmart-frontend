<template>
  <div class="data-table-container">
    <table class="data-table tw:table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
            {{ col.label }}
          </th>
          <th v-if="actions" class="actions-header">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columnCount" class="loading-cell">
            Loading data...
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columnCount" class="empty-cell">
            No data available
          </td>
        </tr>
        <tr v-else v-for="(row, rowIndex) in data" :key="rowIndex">
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.slot || col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="actions" class="actions-cell">
            <slot name="actions" :row="row"></slot>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="pagination-container">
      <div class="pagination-info">
        Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} entries
      </div>
      <div class="pagination-controls">
        <button
          class="page-btn tw:btn tw:btn-sm tw:btn-ghost"
          :disabled="pagination.current_page === 1"
          @click="$emit('page-change', pagination.current_page - 1)"
        >
          Previous
        </button>

        <div class="page-numbers">
          <button
            v-for="page in pagination.last_page"
            :key="page"
            class="page-btn number tw:btn tw:btn-sm tw:btn-ghost"
            :class="{ active: pagination.current_page === page }"
            @click="$emit('page-change', page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          class="page-btn tw:btn tw:btn-sm tw:btn-ghost"
          :disabled="pagination.current_page === pagination.last_page"
          @click="$emit('page-change', pagination.current_page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  actions: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: null
    // Expected: { current_page, last_page, total, from, to }
  }
})
defineEmits(['page-change'])
const columnCount = computed(() => {
  return props.columns.length + (props.actions ? 1 : 0)
})
</script>
<style scoped>
.data-table-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-table {
  width: 100%;
}
.data-table th, .data-table td {
  text-align: left;
}
.data-table th {
  white-space: nowrap;
}
.data-table td {
}
.data-table tbody tr:last-child td {
}
.data-table tbody tr:hover {
}

.loading-cell, .empty-cell {
  text-align: center;
  padding: 3rem;
  color: #80718d;
}

.actions-header, .actions-cell {
  width: 120px;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgb(71 37 128 / 10%);
  border-top: 1px solid rgb(71 37 128 / 10%);
}
.pagination-container .pagination-info {
  font-size: 0.875rem;
  color: #80718d;
}
.pagination-container .pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.pagination-container .page-numbers {
  display: flex;
  gap: 0.25rem;
}
.pagination-container .page-btn {
  transition: all 0.2s;
  user-select: none;
}
.pagination-container .page-btn:hover:not(:disabled) {
}
.pagination-container .page-btn:disabled {
}
.pagination-container .page-btn.active {
}
.pagination-container .page-btn.number {
  min-width: 2.25rem;
  display: flex;
  justify-content: center;
}
</style>
