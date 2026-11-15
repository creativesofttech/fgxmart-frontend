<template>
  <div class="admin-shell layout-container" data-theme="fgx">
    <AdminToast />
    <Sidebar :is-collapsed="sidebarCollapsed" />
    <button v-if="!sidebarCollapsed" class="admin-sidebar-backdrop" aria-label="Close navigation" @click="sidebarCollapsed = true" />

    <div class="main-content" :class="{ 'collapsed': sidebarCollapsed }">
      <Header @toggle-sidebar="toggleSidebar" :is-collapsed="sidebarCollapsed" />

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>
<script setup>
import AdminToast from "~/components/admin/ui/Toast.vue"
import Sidebar from '~/components/admin/layout/Sidebar.vue'
import Header from '~/components/admin/layout/Header.vue'
import { ref } from 'vue'
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const sidebarCollapsed = ref(false)
let mobileViewport
const closeOnMobile = event => { if (event.matches) sidebarCollapsed.value = true }
onMounted(() => {
  mobileViewport = window.matchMedia('(max-width: 760px)')
  closeOnMobile(mobileViewport)
  mobileViewport.addEventListener('change', closeOnMobile)
})
onUnmounted(() => mobileViewport?.removeEventListener('change', closeOnMobile))
const route = useRoute()
watch(() => route.path, () => { if (window.matchMedia('(max-width: 760px)').matches) sidebarCollapsed.value = true })
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>
<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-base-200);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  margin-left: 250px;
  width: calc(100% - 250px);
  min-width: 0;
}
.main-content.collapsed {
  margin-left: 80px;
  width: calc(100% - 80px);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  color: var(--color-base-content);
  background-color: var(--color-base-200);
}
.admin-sidebar-backdrop { display: none; }
@media (prefers-reduced-motion: reduce) { .main-content { transition: none; } }
@media (max-width: 760px) {
  .main-content, .main-content.collapsed { margin-left: 0; width: 100%; }
  .page-content { padding: 18px 14px; }
  .admin-sidebar-backdrop { display: block; position: fixed; inset: 0; z-index: 45; background: #21153866; border: 0; }
}
</style>
