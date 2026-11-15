<template>
  <div class="analytics-wrapper">
    <div class="container-fluid">
      <!-- Header -->
      <header class="tw:flex tw:justify-between tw:items-start tw:mb-10">
        <div>
          <h1 class="tw:text-3xl tw:font-black tw:text-base-content">Market Intelligence</h1>
          <p class="tw:text-sm tw:text-base-content/60 tw:mt-2">Aggregated store performance metrics and order trends.</p>
        </div>
        <div class="bg-indigo-600/10 border border-indigo-500/20 tw:px-4 tw:py-2 tw:rounded-xl tw:flex tw:items-center tw:gap-3">
          <div class="relative">
            <div class="tw:w-3 tw:h-3 bg-indigo-500 tw:rounded-full animate-ping absolute"></div>
            <div class="tw:w-3 tw:h-3 bg-indigo-500 tw:rounded-full relative"></div>
          </div>
          <span class="tw:text-xs tw:font-black text-indigo-400 tw:uppercase tw:tracking-widest">Real-time sync</span>
        </div>
      </header>
      <!-- Row 1: Key Metrics - 4 in a row -->
      <div class="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-6 tw:mb-8">
        <div v-for="(stat, index) in mainMetrics" :key="index" class="metric-card">
          <div class="tw:flex tw:items-center tw:justify-between tw:mb-4">
            <div class="metric-icon" :style="{ color: stat.color, backgroundColor: stat.color + '15' }">
              <component :is="stat.icon" :size="20" />
            </div>
            <span class="trend-badge" :class="stat.trend > 0 ? 'up' : 'down'">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
          </div>
          <h4 class="tw:text-[10px] tw:font-black tw:uppercase tw:tracking-widest tw:text-base-content/60">{{ stat.label }}</h4>
          <h3 class="tw:text-3xl tw:font-black tw:text-base-content tw:mt-1 tw:tabular-nums">
             <span v-if="loading">...</span>
             <span v-else>{{ stat.value }}</span>
          </h3>
          <div class="tw:mt-4 tw:w-full tw:h-1 tw:bg-base-200 tw:rounded-full tw:overflow-hidden">
             <div class="h-full tw:rounded-full shadow-[0_0_8px]" :style="{ width: '65%', backgroundColor: stat.color, boxShadow: `0 0 8px ${stat.color}` }"></div>
          </div>
        </div>
      </div>
      <!-- Row 2: Visual Charts -->
      <div class="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-8 tw:mb-8">
        <div class="chart-container">
          <div class="tw:px-6 tw:py-5 tw:border-b tw:border-base-300 tw:flex tw:items-center tw:justify-between">
            <h3 class="tw:font-bold tw:text-base-content tw:flex tw:items-center tw:gap-2">
              <TrendingUp :size="18" class="text-indigo-400" />
              Sales Dynamics
            </h3>
            <span class="tw:text-[10px] tw:font-bold tw:text-base-content/60">LAST 30 DAYS</span>
          </div>
          <div class="tw:p-6 h-[320px]">
            <Line v-if="!loading" :data="lineChartData" :options="chartOptions" />
            <div v-else class="tw:flex h-full tw:items-center tw:justify-center tw:text-base-content/60">Syncing sales data...</div>
          </div>
        </div>
        <div class="chart-container">
          <div class="tw:px-6 tw:py-5 tw:border-b tw:border-base-300 tw:flex tw:items-center tw:justify-between">
            <h3 class="tw:font-bold tw:text-base-content tw:flex tw:items-center tw:gap-2">
              <PieChart :size="18" class="text-emerald-400" />
              Order Allocation
            </h3>
            <span class="tw:text-[10px] tw:font-bold tw:text-base-content/60">STATUS DISTRO</span>
          </div>
          <div class="tw:p-6 h-[320px] tw:flex tw:items-center tw:justify-center">
            <Doughnut v-if="!loading" :data="doughnutChartData" :options="doughnutOptions" />
            <div v-else class="tw:flex h-full tw:items-center tw:justify-center tw:text-base-content/60">Allocating statuses...</div>
          </div>
        </div>
      </div>
      <!-- Row 3: Product Intelligence - 2 in a row -->
      <div class="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-8">
        <div class="chart-container tw:overflow-hidden">
          <div class="tw:px-6 tw:py-5 tw:border-b tw:border-base-300 bg-slate-900/50">
            <h3 class="tw:font-bold tw:text-base-content tw:flex tw:items-center tw:gap-2">
              <Star :size="18" class="text-amber-400" />
              High Velocity Products
            </h3>
          </div>
          <div class="tw:p-0">
            <table class="tw:w-full text-left border-collapse tw:table">
              <thead>
                <tr class="bg-slate-900/30 tw:text-base-content/60 tw:text-[10px] tw:font-black tw:uppercase tw:tracking-widest tw:border-b tw:border-base-300">
                  <th class="tw:px-6 tw:py-4">Product Identity</th>
                  <th class="tw:px-6 tw:py-4">Orders</th>
                  <th class="tw:px-6 tw:py-4">Total Revenue</th>
                  <th class="tw:px-6 tw:py-4">Performance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr v-for="(prod, i) in topProducts" :key="i" class="hover:bg-indigo-500/5 transition-colors group">
                  <td class="tw:px-6 tw:py-4">
                    <div class="tw:flex tw:items-center tw:gap-3">
                      <div class="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-base-200 tw:flex tw:items-center tw:justify-center text-indigo-400 tw:font-bold tw:text-xs border tw:border-base-300">
                        {{ prod.name[0] }}
                      </div>
                      <span class="tw:text-sm tw:font-semibold tw:text-base-content/60 group-hover:text-white">{{ prod.name }}</span>
                    </div>
                  </td>
                  <td class="tw:px-6 tw:py-4 tw:text-sm tw:text-base-content/60 tw:font-bold tw:tabular-nums">{{ prod.count }}</td>
                  <td class="tw:px-6 tw:py-4 tw:text-sm tw:text-base-content/60 tw:font-bold tw:tabular-nums">${{ prod.revenue.toFixed(2) }}</td>
                  <td class="tw:px-6 tw:py-4">
                    <div class="tw:w-20 tw:bg-base-200 h-1.5 tw:rounded-full tw:overflow-hidden">
                      <div class="bg-indigo-500 h-full tw:rounded-full" :style="{ width: (prod.revenue / topProducts[0].revenue * 100) + '%' }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="chart-container tw:flex flex-column">
           <div class="tw:px-6 tw:py-5 tw:border-b tw:border-base-300 bg-slate-900/50">
            <h3 class="tw:font-bold tw:text-base-content tw:flex tw:items-center tw:gap-2">
              <History :size="18" class="text-rose-400" />
              Latest Orders
            </h3>
          </div>
          <div class="flex-grow divide-y divide-slate-800">
             <div v-for="order in recentOrders" :key="order.id" class="tw:p-4 tw:flex tw:justify-between tw:items-center group cursor-pointer hover:bg-slate-800/30">
               <div>
                  <h4 class="tw:text-sm tw:font-bold tw:text-base-content/60 group-hover:text-indigo-400 transition-colors">{{ order.order_number }}</h4>
                  <p class="tw:text-[10px] tw:text-base-content/60 tw:uppercase tw:font-black tw:mt-1">{{ order.user?.name || 'Guest User' }}</p>
               </div>
               <div class="text-right">
                  <p class="tw:text-sm tw:font-black tw:text-base-content">${{ Number(order.total_amount).toFixed(2) }}</p>
                  <span class="tw:text-[9px] tw:font-black tw:uppercase tw:py-0.5 tw:px-1.5 rounded transition-all" :class="getStatusClass(order.status)">
                    {{ order.status }}
                  </span>
               </div>
             </div>
          </div>
          <NuxtLink to="/admin/orders" class="tw:p-4 text-center tw:text-xs tw:font-bold text-indigo-400 tw:hover:text-base-content hover:bg-indigo-600 transition-all border-t tw:border-base-300">
             Open Full Catalog
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import {
  Eye, ShoppingCart, Search, CreditCard, TrendingUp, PieChart, Star, History, History as BoxIcon, Package, Grid, History as Clock
} from 'lucide-vue-next'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
ChartJS.defaults.font.family = 'Poppins, sans-serif'
ChartJS.register(
  Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, ArcElement
)
const config = useRuntimeConfig()
const loading = ref(true)
const rawOrders = ref([])
const topProducts = ref([])
const recentOrders = ref([])
const mainMetrics = ref([
  { label: 'Total Revenue', value: '$0', trend: 15.2, color: '#6366f1', icon: CreditCard },
  { label: 'Accumulated Orders', value: '0', trend: 10.4, color: '#10b981', icon: ShoppingCart },
  { label: 'Active Products', value: '0', trend: 2.1, color: '#f59e0b', icon: Package },
  { label: 'Store Categories', value: '0', trend: 5.6, color: '#ec4899', icon: Grid },
])
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { display: false },
    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, weight: '900' } } }
  },
  plugins: { legend: { display: false } }
}
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20, font: { size: 10, weight: 'bold' } } }
  },
  cutout: '75%'
}
const lineChartData = computed(() => ({
  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  datasets: [{
    label: 'Sales',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
    pointBackgroundColor: '#fff',
    data: [40, 39, 10, 40, 39, 80, 40],
    borderWidth: 4,
    tension: 0.4,
    fill: true
  }]
}))
const doughnutChartData = computed(() => {
  const pending = rawOrders.value.filter(o => o.status === 'pending').length
  const paid = rawOrders.value.filter(o => o.status === 'paid' || o.payment_status === 'paid').length
  const shipped = rawOrders.value.filter(o => o.status === 'shipped' || o.status === 'delivered').length

  return {
    labels: ['Pending', 'Settled', 'Logistics'],
    datasets: [{
      backgroundColor: ['#f59e0b', '#10b981', '#6366f1'],
      borderWidth: 0,
      data: [pending || 1, paid || 2, shipped || 1]
    }]
  }
})
onMounted(async () => {
  try {
    const [orders, products, categories] = await Promise.all([
      $adminApi('/orders'),
      $adminApi('/products'),
      $adminApi('/categories'),
    ])
    rawOrders.value = orders.data || []
    recentOrders.value = rawOrders.value.slice(0, 5)

    // Revenue Calc
    const revenue = rawOrders.value.reduce((acc, curr) => acc + Number(curr.total_amount), 0)
    mainMetrics.value[0].value = `$${revenue.toLocaleString()}`
    mainMetrics.value[1].value = rawOrders.value.length.toString()
    mainMetrics.value[2].value = products.total || products.data?.length || 0
    mainMetrics.value[3].value = categories.data?.length || 0
    // Top Products Mock Logic from Orders
    const productFrequency = {}
    rawOrders.value.forEach(order => {
      order.items?.forEach(item => {
        if (!productFrequency[item.product_name]) {
          productFrequency[item.product_name] = { count: 0, revenue: 0 }
        }
        productFrequency[item.product_name].count += item.quantity
        productFrequency[item.product_name].revenue += Number(item.subtotal)
      })
    })
    topProducts.value = Object.entries(productFrequency)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  } catch (err) {
    console.error('Failed to lift analytics:', err)
  } finally {
    loading.value = false
  }
})
const getStatusClass = (status) => {
  if (status === 'pending') return 'text-amber-400 bg-amber-400/10'
  if (status === 'completed' || status === 'paid') return 'text-emerald-400 bg-emerald-400/10'
  return 'text-indigo-400 bg-indigo-400/10'
}
</script>
<style scoped>
.analytics-wrapper {
  background-color: var(--color-base-200); /* Slate 900 equivalent deep dark */
  min-height: 100vh;
  padding: 2.5rem;
  font-family: var(--app-font-family);
}
.analytics-wrapper .metric-card {
  background: var(--color-base-200);
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid var(--color-base-100);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.analytics-wrapper .metric-card:hover {
  border-color: var(--color-base-300);
  transform: translateY(-4px);
  background: var(--color-base-100);
}
.analytics-wrapper .metric-card .metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(71 37 128 / 10%);
}
.analytics-wrapper .chart-container {
  background: var(--color-base-200);
  border-radius: 1.25rem;
  border: 1px solid var(--color-base-100);
  overflow: hidden;
}
.analytics-wrapper .trend-badge {
  font-size: 10px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 6px;
}
.analytics-wrapper .trend-badge.up {
  background: rgba(16, 185, 129, 0.0823529412);
  color: #10b981;
}
.analytics-wrapper .trend-badge.down {
  background: rgba(239, 68, 68, 0.0823529412);
  color: #ef4444;
}

/* Low-level UI framework simulation */
/* Grid System */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .lg\:col-span-2 {
    grid-column: span 2/span 2;
  }
}
/* Utilities */
.mb-8 {
  margin-bottom: 2rem;
}

.mb-10 {
  margin-bottom: 2.5rem;
}

.flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.text-white {
  color: white;
}

.uppercase {
  text-transform: uppercase;
}

.tracking-widest {
  letter-spacing: 0.1em;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.p-6 {
  padding: 1.5rem;
}

.p-4 {
  padding: 1rem;
}

.p-0 {
  padding: 0;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-5 {
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.gap-6 {
  gap: 1.5rem;
}

.gap-8 {
  gap: 2rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-2 {
  gap: 0.5rem;
}

.text-center {
  text-align: center;
}

.rounded-full {
  border-radius: 9999px;
}

.overflow-hidden {
  overflow: hidden;
}

.flex-grow {
  flex-grow: 1;
}

.w-20 {
  width: 5rem;
}

.h-1\.5 {
  height: 0.375rem;
}

.divide-y > * + * {
  border-top-width: 1px;
}

/* Typography */
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-\[10px\] {
  font-size: 10px;
}

.text-\[9px\] {
  font-size: 9px;
}

.font-bold {
  font-weight: 700;
}

.font-black {
  font-weight: 900;
}

.font-semibold {
  font-weight: 600;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
