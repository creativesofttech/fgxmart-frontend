<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }" aria-label="Admin navigation">
    <NuxtLink to="/admin/dashboard" class="sidebar-header" aria-label="FGXMART Admin dashboard"><img v-if="!isCollapsed" src="/images/logo/fgx-logo-dark.png" alt="FGX MART" width="170" /><span v-else class="logo-small">FGX</span></NuxtLink>
    <ul class="tw:menu sidebar-nav">
      <li v-for="item in visibleMenuItems" :key="item.label">
        <NuxtLink v-if="!item.children" :to="item.path" class="nav-item" active-class="active" :title="item.label"><component :is="item.icon" class="nav-icon" /><span v-if="!isCollapsed">{{ item.label }}</span></NuxtLink>
        <template v-else>
          <button type="button" class="nav-item parent-item" :aria-expanded="openSubmenus.includes(item.label)" :title="item.label" @click="toggleSubmenu(item.label)"><component :is="item.icon" class="nav-icon" /><span v-if="!isCollapsed">{{ item.label }}</span><ChevronDown v-if="!isCollapsed" class="chevron" :class="{ rotate: openSubmenus.includes(item.label) }" /></button>
          <ul v-if="openSubmenus.includes(item.label)" class="submenu">
            <li v-for="sub in item.children" :key="sub.path"><NuxtLink :to="sub.path" class="nav-item" active-class="active" :title="sub.label"><component :is="sub.icon" class="nav-icon" /><span v-if="!isCollapsed">{{ sub.label }}</span></NuxtLink></li>
          </ul>
        </template>
      </li>
    </ul>
  </aside>
</template>
<script setup>
import { ref } from 'vue'
import {
  LayoutDashboard,
  Settings,
  Shield,
  Key,
  BarChart3,
  Package,
  PackagePlus,
  ShoppingBag,
  Boxes,
  Grid,
  List,
  Globe,
  Tag,
  Building,
  HelpCircle,
  FileText,
  ChevronDown
} from 'lucide-vue-next'
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})
const openSubmenus = ref(['Core Settings', 'Product Settings', 'Manage Products'])
const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    icon: BarChart3
  },
  {
    label: 'Orders',
    path: '/admin/orders',
    icon: ShoppingBag
  },
  {
    label: 'Product Settings',
    icon: Package,
    children: [
      {
        label: 'Categories',
        path: '/admin/categories',
        icon: Grid
      },
      {
        label: 'Attributes',
        path: '/admin/attributes',
        icon: List
      },
      {
        label: 'Brands',
        path: '/admin/brands',
        icon: Tag
      }
    ]
  },
  {
    label: 'Manage Products',
    icon: ShoppingBag,
    children: [
      {
        label: 'Create Product',
        path: '/admin/products/create',
        icon: PackagePlus
      },
      {
        label: 'Products',
        path: '/admin/products',
        icon: Boxes
      }
    ]
  },
  {
    label: 'Core Settings',
    icon: Settings,
    children: [
      {
        label: 'Roles',
        path: '/admin/roles',
        icon: Shield
      },
      {
        label: 'Permissions',
        path: '/admin/permissions',
        icon: Key
      },
      {
        label: 'Countries',
        path: '/admin/countries',
        icon: Globe
      },
      {
        label: 'Company Details',
        path: '/admin/company-settings',
        icon: Building
      },
      {
        label: 'FAQs',
        path: '/admin/faqs',
        icon: HelpCircle
      },
      {
        label: 'Website Pages',
        path: '/admin/pages',
        icon: FileText
      }
    ]
  }
]
const { can } = useAdminAuth()
const canVisit = (path) => {
  const [, , resource, action] = path.split('/')
  if (resource === 'dashboard') return true
  return can(`${resource === 'analytics' ? 'orders' : resource}.${action === 'create' ? 'create' : 'index'}`)
}
const visibleMenuItems = computed(() => menuItems.flatMap(item => {
  if (!item.children) return canVisit(item.path) ? [item] : []
  const children = item.children.filter(child => canVisit(child.path))
  return children.length ? [{ ...item, children }] : []
}))

const toggleSubmenu = (label) => {
  if (openSubmenus.value.includes(label)) {
    openSubmenus.value = openSubmenus.value.filter(item => item !== label)
  } else {
    openSubmenus.value.push(label)
  }
}
</script>
<style scoped>
.sidebar { width: 250px; height: 100dvh; position: fixed; inset: 0 auto 0 0; z-index: 50; display: flex; flex-direction: column; background: var(--color-base-100); border-right: 1px solid var(--color-base-300); transition: width .2s, transform .2s; }
.sidebar.collapsed { width: 80px; }
.sidebar-header { height: var(--admin-header-height); min-height: var(--admin-header-height); flex-shrink: 0; padding: 12px 16px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--color-base-300); }
.sidebar-header img { width: 170px; max-width: 100%; }
.logo-small { color: var(--color-primary); font-weight: 800; }
.sidebar-nav { flex: 1; width: 100%; padding: 16px 10px; overflow-y: auto; flex-wrap: nowrap; gap: 5px; }
.nav-item { min-height: 43px; width: 100%; display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 9px; font-size: 13px; color: #796b88; text-align: left; }
.nav-item.active, .nav-item:hover { background: var(--color-accent); color: var(--color-primary); }
.nav-icon { width: 19px; height: 19px; flex-shrink: 0; }
.chevron { width: 15px; margin-left: auto; }
.chevron.rotate { transform: rotate(180deg); }
.submenu { margin: 3px 0 7px 8px; }
.collapsed .submenu { margin-left: 0; padding-left: 0; border: 0; }
.collapsed .nav-item { justify-content: center; padding-inline: 10px; }
@media(prefers-reduced-motion: reduce) { .sidebar { transition: none; } }
@media(max-width: 760px) { .sidebar { width: 250px; box-shadow: 8px 0 30px #21153820; } .sidebar.collapsed { width: 250px; transform: translateX(-100%); } }
</style>
