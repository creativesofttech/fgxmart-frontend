<template>
  <div class="dashboard-page" :aria-busy="pending">
    <div class="dashboard-heading"><div><h1>Welcome back, {{ admin.user.value?.name || 'Administrator' }} <span aria-hidden="true">👋</span></h1><p>Here’s what’s happening with your store today.</p></div><label class="period-control"><CalendarDays :size="17" aria-hidden="true" /><span class="sr-only">Dashboard period</span><AppSelect v-model="days" :options="[7, 30, 90].map(id => ({ id, name: `Last ${id} days` }))" aria-label="Dashboard period" :allow-empty="false" :searchable="false" /></label></div>
    <div v-if="pending && !dashboard" class="metric-grid" aria-label="Loading dashboard"><div v-for="i in 4" :key="i" class="tw:skeleton metric-skeleton" /></div>
    <div v-else-if="error" class="tw:alert tw:alert-error dashboard-error" role="alert"><AlertCircle :size="20" aria-hidden="true" /><span>We couldn’t load the dashboard. Please try again.</span><button type="button" class="tw:btn tw:btn-sm" @click="refresh">Retry</button></div>
    <template v-else-if="dashboard">
      <p v-if="pending" class="refresh-note" role="status">Updating dashboard…</p>
      <div class="metric-grid" :class="{ 'is-refreshing': pending }">
        <article v-for="metric in metrics" :key="metric.key" class="tw:card metric-card" :class="`metric-${metric.tone}`" :data-metric="metric.key">
          <span class="metric-icon"><component :is="metric.icon" :size="25" :stroke-width="1.8" aria-hidden="true" /></span><div class="metric-content"><h2>{{ metric.label }}</h2><strong class="metric-value">{{ metric.key === 'revenue' ? money(metric.value) : count(metric.value) }}</strong><div class="metric-comparison"><span class="tw:badge trend-pill" :class="metric.change_percent < 0 ? 'trend-down' : metric.change_percent === 0 ? 'trend-neutral' : 'trend-up'"><ArrowDown v-if="metric.change_percent < 0" :size="11" aria-hidden="true" /><Minus v-else-if="metric.change_percent === 0" :size="11" aria-hidden="true" /><ArrowUp v-else :size="11" aria-hidden="true" />{{ trend(metric.change_percent) }}</span><small>{{ metric.comparison === 'period_start' ? 'vs. start of period' : `vs. previous ${dashboard.period.days} days` }}</small></div></div>
        </article>
      </div>
      <p v-if="!metrics.length" class="dashboard-empty">Your workspace is ready. Use the sidebar to access the tools assigned to your role.</p>
      <div v-if="dashboard.permissions.orders" class="charts-grid" :class="{ 'is-refreshing': pending }">
        <section class="tw:card dashboard-panel sales-panel" aria-labelledby="sales-title"><div class="panel-heading"><h2 id="sales-title"><span class="section-icon"><ChartNoAxesCombined :size="19" aria-hidden="true" /></span>Sales Overview</h2><div class="sales-summary"><span>Revenue: <strong>{{ money(dashboard.metrics.revenue.value) }}</strong></span><span>Orders: <strong>{{ count(dashboard.metrics.orders.value) }}</strong></span><span>Paid AOV: <strong>{{ money(dashboard.sales.average_order_value) }}</strong></span></div></div><p class="panel-caption">Paid, non-cancelled orders · {{ dateLabel(dashboard.period.start) }} – {{ dateLabel(dashboard.period.end) }} · {{ dashboard.period.timezone }}</p><div class="sales-chart"><ClientOnly><Line :data="lineData" :options="lineOptions" aria-label="Daily paid order revenue" role="img" /></ClientOnly></div><table class="sr-only"><caption>Daily revenue and order counts</caption><thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead><tbody><tr v-for="day in dashboard.sales.series" :key="day.date"><td>{{ day.date }}</td><td>{{ money(day.revenue) }}</td><td>{{ day.orders }}</td></tr></tbody></table></section>
        <section class="tw:card dashboard-panel" aria-labelledby="status-title"><div class="panel-heading"><h2 id="status-title"><span class="section-icon"><ClipboardList :size="19" aria-hidden="true" /></span>Order Status</h2></div><div class="status-content"><div class="status-chart"><ClientOnly><Doughnut v-if="orderTotal" :data="donutData" :options="donutOptions" aria-label="Orders by status" role="img" /><div v-else class="empty-ring" /></ClientOnly><div class="donut-centre"><strong>{{ count(orderTotal) }}</strong><span>Orders</span></div></div><ul class="status-legend"><li v-for="status in statuses" :key="status.status"><span class="legend-dot" :style="{ background: status.color }" /><span>{{ status.label }}</span><strong>{{ orderTotal ? (status.count / orderTotal * 100).toFixed(1) : '0' }}%</strong><span class="sr-only">{{ status.count }} orders</span></li></ul></div></section>
      </div>
      <div v-if="dashboard.permissions.orders" class="tables-grid" :class="{ 'is-refreshing': pending }">
        <section class="tw:card dashboard-panel recent-panel" aria-labelledby="recent-title"><div class="panel-heading"><h2 id="recent-title"><span class="section-icon"><ListOrdered :size="19" aria-hidden="true" /></span>Recent Orders</h2><NuxtLink to="/admin/orders" class="panel-link">View all orders <ArrowRight :size="15" aria-hidden="true" /></NuxtLink></div><div v-if="dashboard.recent_orders.length" class="dashboard-table-wrap"><table class="tw:table dashboard-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody><tr v-for="order in dashboard.recent_orders" :key="order.id"><td><NuxtLink :to="`/admin/orders/${encodeURIComponent(order.order_number)}`" class="order-link">#{{ order.order_number }}</NuxtLink></td><td><span class="customer-name"><UserRound :size="13" aria-hidden="true" />{{ order.customer }}</span></td><td class="table-amount">{{ money(order.amount) }}</td><td><span class="tw:badge order-status" :style="{ color: statusStyle(order.status).color, backgroundColor: statusStyle(order.status).background }">{{ statusStyle(order.status).label }}</span></td><td class="table-date">{{ dateLabel(order.date) }}</td></tr></tbody></table></div><div v-else class="dashboard-empty"><ShoppingCart :size="26" aria-hidden="true" /><p>No orders in this period.</p></div></section>
        <section v-if="dashboard.permissions.products" class="tw:card dashboard-panel top-panel" aria-labelledby="top-title"><div class="panel-heading"><h2 id="top-title"><span class="section-icon"><Trophy :size="19" aria-hidden="true" /></span>Top Selling Products</h2><NuxtLink to="/admin/products" class="panel-link">View all products <ArrowRight :size="15" aria-hidden="true" /></NuxtLink></div><p class="panel-caption">Ranked by units in paid, non-cancelled orders.</p><ul v-if="dashboard.top_products?.length" class="top-products"><li v-for="(product, index) in dashboard.top_products" :key="`${product.id}-${index}`"><img :src="product.image || placeholder" :alt="product.name" width="43" height="43" loading="lazy" @error="imageFallback" /><NuxtLink v-if="product.id && admin.can('products.edit')" :to="`/admin/products/${product.id}/edit`" class="top-name">{{ product.name }}</NuxtLink><span v-else class="top-name">{{ product.name }}</span><span class="top-quantity">{{ count(product.quantity) }} sold</span><strong>{{ money(product.revenue) }}</strong></li></ul><div v-else class="dashboard-empty"><Package :size="26" aria-hidden="true" /><p>No paid product sales in this period.</p></div></section>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ArrowDown, ArrowRight, ArrowUp, AlertCircle, CalendarDays, ChartNoAxesCombined, ClipboardList, Coins, ListOrdered, Minus, Package, ShoppingCart, Trophy, UserRound, UsersRound } from 'lucide-vue-next'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
ChartJS.defaults.font.family = 'Poppins, sans-serif'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)
definePageMeta({ layout: 'admin' })
useHead({ title: 'Dashboard — FGX MART Admin' })
const admin = useAdminAuth()
const days = ref(30)
const { data: response, pending, error, refresh } = await useAsyncData('admin-dashboard', () => $adminApi('/dashboard', { query: { days: days.value } }), { watch: [days] })
const dashboard = computed(() => response.value?.data?.metrics ? response.value.data : null)
const placeholder = '/assets/images/home/product-placeholder.webp'
const count = value => new Intl.NumberFormat('en-US').format(Number(value || 0))
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboard.value?.period.currency || 'USD', maximumFractionDigits: 2 }).format(Number(value || 0))
const dateLabel = date => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
const metrics = computed(() => [
  { key: 'orders', label: 'Total Orders', icon: ShoppingCart, tone: 'green' },
  { key: 'products', label: 'Total Products', icon: Package, tone: 'purple' },
  { key: 'customers', label: 'Total Customers', icon: UsersRound, tone: 'gold' },
  { key: 'revenue', label: 'Total Revenue', icon: Coins, tone: 'purple' },
].filter(metric => dashboard.value?.metrics[metric.key]).map(metric => ({ ...metric, ...dashboard.value.metrics[metric.key] })))
const trend = value => value === null ? 'New' : `${value > 0 ? '+' : ''}${value}%`
const statusDefinitions = {
  delivered: { label: 'Delivered', color: '#80b649', background: '#edf6e5' },
  processing: { label: 'Processing', color: '#8051cd', background: '#efe8fa' },
  confirmed: { label: 'Confirmed', color: '#5791cb', background: '#eaf3fc' },
  shipped: { label: 'Shipped', color: '#439a91', background: '#e6f4f1' },
  pending: { label: 'Pending', color: '#d7ac39', background: '#fff6df' },
  cancelled: { label: 'Cancelled', color: '#d86b87', background: '#fbeaf0' },
}
const statusStyle = status => statusDefinitions[status] || { label: status, color: '#8c8299', background: '#f0edf5' }
const statuses = computed(() => (dashboard.value?.statuses || []).map(status => ({ ...status, ...statusStyle(status.status) })))
const orderTotal = computed(() => statuses.value.reduce((sum, status) => sum + status.count, 0))
const lineData = computed(() => ({ labels: (dashboard.value?.sales?.series || []).map(day => dateLabel(day.date)), datasets: [{ label: 'Revenue', data: (dashboard.value?.sales?.series || []).map(day => day.revenue), fill: true, backgroundColor: '#8c62d32a', borderColor: '#8251c7', borderWidth: 2.5, pointRadius: days.value > 30 ? 0 : 2.5, pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2, tension: .3 }] }))
const lineOptions = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { displayColors: false, backgroundColor: '#6940a6', padding: 11, callbacks: { label: context => money(context.parsed.y) } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#93879f', font: { size: 10 }, maxTicksLimit: 7, maxRotation: 0 } }, y: { beginAtZero: true, border: { display: false }, grid: { color: '#f0eaf6' }, ticks: { color: '#93879f', font: { size: 10 }, maxTicksLimit: 5, callback: value => new Intl.NumberFormat('en-US', { style: 'currency', currency: dashboard.value?.period.currency || 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(value) } } } }
const donutData = computed(() => ({ labels: statuses.value.map(status => status.label), datasets: [{ data: statuses.value.map(status => status.count), backgroundColor: statuses.value.map(status => status.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 3 }] }))
const donutOptions = { responsive: true, maintainAspectRatio: false, animation: false, cutout: '73%', plugins: { legend: { display: false } } }
const imageFallback = event => { if (!event.target.dataset.fallback) { event.target.dataset.fallback = 'true'; event.target.src = placeholder } }
</script>
<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 22px; max-width: 1800px; margin: 0 auto; }
.dashboard-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 6px 0 3px; }
.dashboard-heading h1 { margin: 0 0 8px; font-size: clamp(23px, 2.1vw, 31px); line-height: 1.25; letter-spacing: -.8px; font-weight: 780; color: #26173c; }
.dashboard-heading h1 span { font-size: .8em; white-space: nowrap; }
.dashboard-heading p { margin: 0; font-size: 13px; color: #8e7f9b; }
.period-control { display: flex; align-items: center; gap: 9px; padding-left: 13px; background: #fff; border: 1px solid #dcd0ed; border-radius: 10px; color: #8d69b4; flex-shrink: 0; }
.period-control :deep(.select-trigger) { min-height: 40px; height: 40px; width: 141px; padding-left: 0; border: 0; background-color: transparent; font-size: 12px; color: #57416e; box-shadow: none; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.metric-skeleton { min-height: 140px; background: #eee8f5; border-radius: 17px; }
.metric-card { --metric-color: #8254c5; --metric-tint: #f0e8fc; display: flex; flex-direction: row; align-items: flex-start; gap: 14px; min-width: 0; min-height: 145px; padding: 22px 19px 25px; border: 1px solid #f1edf6; border-radius: 17px; background: #fff; box-shadow: 0 5px 16px #39205604; overflow: hidden; position: relative; }
.metric-green { --metric-color: #73a943; --metric-tint: #edf7e6; }
.metric-gold { --metric-color: #d9af3c; --metric-tint: #fff7e3; }
.metric-card::after { content: ''; position: absolute; left: -10%; bottom: -28px; width: 125%; height: 39px; background: var(--metric-tint); border-radius: 50% 50% 0 0; transform: rotate(-4deg); }
.metric-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--metric-tint); color: var(--metric-color); display: grid; place-items: center; flex-shrink: 0; }
.metric-content { flex: 1; min-width: 0; }
.metric-content h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; color: #645174; }
.metric-value { display: block; font-size: clamp(22px, 2.1vw, 32px); line-height: 1.2; letter-spacing: -.8px; font-weight: 780; color: #29183e; white-space: nowrap; }
.metric-comparison { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 9px; }
.metric-comparison small { font-size: 9px; color: #a496af; }
.trend-pill { display: inline-flex; align-items: center; gap: 3px; border: 0; min-height: 0; padding: 3px 6px; border-radius: 6px; font-size: 9px; font-weight: 650; }
.trend-up { color: #659b37; background: #edf7e4; }
.trend-down { color: #c45e7b; background: #fbeaf0; }
.trend-neutral { color: #8f829f; background: #f1edf6; }
.charts-grid { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(300px, 1fr); gap: 20px; }
.dashboard-panel { min-width: 0; padding: 20px; border: 1px solid #f0ebf6; border-radius: 17px; background: #fff; box-shadow: 0 4px 14px #39205603; }
.panel-heading { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 13px; margin-bottom: 17px; }
.panel-heading h2 { display: flex; align-items: center; gap: 9px; font-size: 17px; line-height: 1.3; font-weight: 730; letter-spacing: -.4px; margin: 0; color: #2d1d42; }
.section-icon { display: grid; place-items: center; width: 29px; height: 29px; background: #f1eafb; border-radius: 50%; color: #8b5bbf; flex-shrink: 0; }
.sales-summary { display: flex; flex-wrap: wrap; gap: 13px; color: #9a8ba6; font-size: 10px; }
.sales-summary strong { color: #5d4774; font-weight: 650; }
.panel-caption { margin: -5px 0 16px; color: #b1a2bc; font-size: 9px; line-height: 1.6; }
.sales-chart { height: 228px; width: 100%; position: relative; }
.status-content { display: flex; align-items: center; justify-content: center; gap: 22px; min-height: 245px; }
.status-chart { position: relative; width: 155px; height: 155px; flex-shrink: 0; }
.donut-centre { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.donut-centre strong { font-size: 28px; line-height: 1.2; font-weight: 750; letter-spacing: -.7px; }
.donut-centre span { font-size: 11px; color: #a495af; margin-top: 3px; }
.empty-ring { width: 100%; height: 100%; border: 19px solid #f0ebf5; border-radius: 50%; }
.status-legend { flex: 1; padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 14px; }
.status-legend li { display: flex; align-items: center; gap: 8px; font-size: 10px; color: #82708f; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-legend strong { font-size: 10px; font-weight: 600; margin-left: auto; color: #8e7b9e; }
.tables-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.panel-link { display: flex; align-items: center; gap: 6px; color: #8b57c4; font-size: 10px; font-weight: 600; white-space: nowrap; }
.panel-link:hover, .order-link:hover, .top-name:hover { color: #5b2a93; }
.dashboard-table-wrap { overflow-x: auto; }
.dashboard-table { width: 100%; min-width: 470px; border-collapse: collapse; font-size: 10px; }
.dashboard-table th { background: #faf8fd; color: #9a89a8; text-align: left; font-size: 9px; font-weight: 600; padding: 11px 8px; white-space: nowrap; }
.dashboard-table td { padding: 12px 8px; border-bottom: 1px solid #f4eff8; color: #897994; }
.dashboard-table tbody tr:last-child td { border-bottom: 0; }
.order-link { color: #8b57c4; font-weight: 650; white-space: nowrap; }
.customer-name { display: flex; align-items: center; gap: 5px; }
.table-amount { font-weight: 650; white-space: nowrap; color: #624d74 !important; }
.table-date { white-space: nowrap; }
.order-status { font-size: 9px; min-height: 0; height: auto; border: 0; padding: 3px 7px; border-radius: 99px; line-height: 1.4; }
.top-products { margin: 0; padding: 0; list-style: none; }
.top-products li { display: flex; align-items: center; gap: 11px; padding: 10px 0; border-bottom: 1px solid #f4eff8; min-width: 0; }
.top-products li:last-child { border-bottom: 0; }
.top-products img { width: 38px; height: 38px; object-fit: contain; border-radius: 6px; background: #faf8fd; flex-shrink: 0; }
.top-name { color: #624d74; font-size: 11px; font-weight: 600; flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.top-quantity { font-size: 10px; color: #a595af; white-space: nowrap; }
.top-products strong { font-size: 11px; color: #624d74; font-weight: 650; white-space: nowrap; }
.dashboard-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 35px 12px; min-height: 160px; color: #b0a0bb; font-size: 12px; text-align: center; }
.dashboard-empty p { margin: 0; }
.dashboard-error { padding: 18px; border: 1px solid #eed5dc; background: #fff0f4; color: #b34d66; border-radius: 12px; }
.refresh-note { margin: -9px 0 -10px; color: #9a85aa; font-size: 11px; }
.is-refreshing { opacity: .6; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media(max-width: 1350px) { .metric-card { padding: 20px 15px 24px; gap: 10px; } .metric-icon { width: 37px; height: 37px; } .status-content { gap: 14px; } .status-chart { width: 135px; height: 135px; } .charts-grid { grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); } }
@media(max-width: 1100px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .charts-grid, .tables-grid { grid-template-columns: 1fr; } .status-chart { width: 175px; height: 175px; } .status-legend { max-width: 260px; } .status-content { gap: 40px; min-height: 220px; } .metric-value { font-size: 30px; } }
@media(max-width: 600px) { .dashboard-page { gap: 16px; } .dashboard-heading { align-items: flex-start; flex-direction: column; gap: 16px; } .dashboard-heading h1 { font-size: 23px; } .dashboard-heading p { font-size: 12px; } .metric-grid { gap: 12px; } .metric-card { flex-direction: column; padding: 16px 13px 23px; gap: 11px; min-height: 185px; } .metric-content { width: 100%; } .metric-content h2 { font-size: 11px; } .metric-value { font-size: 25px; } .metric-comparison { gap: 5px; } .dashboard-panel { padding: 16px 13px; } .panel-heading h2 { font-size: 16px; } .sales-chart { height: 210px; } .status-content { gap: 20px; } .status-chart { width: 140px; height: 140px; } .status-legend { gap: 13px; } .status-legend li, .status-legend strong { font-size: 9px; } .top-products li { flex-wrap: wrap; gap: 8px; } .top-name { flex-basis: 40%; } .top-products strong, .top-quantity { font-size: 10px; } }
@media(max-width: 360px) { .status-chart { width: 120px; height: 120px; } .status-content { gap: 12px; } .donut-centre strong { font-size: 24px; } .metric-value { font-size: 22px; } }
</style>
