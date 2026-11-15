<template>
  <header class="tw:navbar header">
    <div class="left-section">
      <button class="tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" aria-label="Toggle navigation" @click="$emit('toggleSidebar')"><Menu :size="20" /></button>
      <h2 class="page-title">{{ currentPage }}</h2>
    </div>
    <details ref="profileMenu" class="tw:dropdown tw:dropdown-end profile-menu" @keydown.esc.prevent="closeMenu(true)">
      <summary role="button" class="tw:btn tw:btn-ghost profile-trigger" aria-label="Open admin profile menu">
        <span class="profile-avatar" aria-hidden="true">{{ initials }}</span>
        <span class="profile-identity"><strong>{{ admin.user.value?.name || 'Administrator' }}</strong><small>{{ roleLabel }}</small></span>
        <ChevronDown :size="15" class="profile-chevron" aria-hidden="true" />
      </summary>
      <ul class="tw:dropdown-content tw:menu profile-dropdown" aria-label="Admin profile actions">
        <li><button type="button" @click="openProfile"><UserRound :size="17" aria-hidden="true" />Local Profile</button></li>
        <li class="logout-item"><button type="button" :disabled="loggingOut" @click="logout"><LogOut :size="17" aria-hidden="true" />{{ loggingOut ? 'Signing out…' : 'Logout' }}</button></li>
      </ul>
    </details>
    <Modal v-model="showProfile" title="Local Profile" width="480px">
      <div class="profile-overview"><span class="profile-avatar profile-avatar-large" aria-hidden="true">{{ initials }}</span><div><h4>{{ admin.user.value?.name }}</h4><p>Your signed-in administrator account</p></div></div>
      <dl class="profile-fields"><div><dt>Name</dt><dd>{{ admin.user.value?.name }}</dd></div><div><dt>Email address</dt><dd>{{ admin.user.value?.email }}</dd></div><div><dt>Roles</dt><dd class="profile-roles"><span v-for="role in admin.user.value?.roles || []" :key="role" class="tw:badge tw:badge-soft tw:badge-primary">{{ formatRole(role) }}</span><span v-if="!admin.user.value?.roles?.length">No role assigned</span></dd></div></dl>
      <template #footer><button type="button" class="tw:btn tw:btn-primary" @click="showProfile = false">Done</button></template>
    </Modal>
  </header>
</template>
<script setup>
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-vue-next'
import Modal from '~/components/admin/ui/Modal.vue'
defineProps({ isCollapsed: Boolean })
defineEmits(['toggleSidebar'])
const route = useRoute()
const admin = useAdminAuth()
const toast = useAdminToast()
const profileMenu = ref(null)
const showProfile = ref(false)
const loggingOut = ref(false)
const formatRole = role => role.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const currentPage = computed(() => String(route.params.slug || route.path.split('/').filter(Boolean).at(-1) || 'Dashboard').replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()))
const initials = computed(() => (admin.user.value?.name || 'Admin').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())
const roleLabel = computed(() => admin.user.value?.roles?.length ? formatRole(admin.user.value.roles[0]) : 'Administrator')
const closeMenu = (restoreFocus = false) => { if (profileMenu.value) { profileMenu.value.open = false; if (restoreFocus) profileMenu.value.querySelector('summary')?.focus() } }
const openProfile = () => { closeMenu(); showProfile.value = true }
const closeOnOutside = event => { if (!profileMenu.value?.contains(event.target)) closeMenu() }
watch(() => route.fullPath, () => { closeMenu(); showProfile.value = false })
onMounted(() => document.addEventListener('pointerdown', closeOnOutside))
onUnmounted(() => document.removeEventListener('pointerdown', closeOnOutside))
const logout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  closeMenu()
  try { await $adminApi('/logout', { method: 'POST' }); admin.user.value = null; await navigateTo('/admin-access') }
  catch { toast.error('Unable to end your session. Please try again.') }
  finally { loggingOut.value = false }
}
</script>
<style scoped>
.header { position: relative; z-index: 20; height: var(--admin-header-height); min-height: var(--admin-header-height); flex-shrink: 0; background: var(--color-base-100); border-bottom: 1px solid var(--color-base-300); display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 12px 24px; width: 100%; }
.left-section { display: flex; align-items: center; gap: 16px; min-width: 0; }
.page-title { margin: 0; font-size: 18px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-menu { position: relative; flex-shrink: 0; }
.profile-trigger { display: flex; align-items: center; gap: 10px; list-style: none; padding: 4px 8px !important; min-height: 48px !important; height: auto; }
.profile-trigger::-webkit-details-marker { display: none; }
.profile-avatar { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; background: #ede5f8; color: #603592; border: 1px solid #e1d3ef; font-size: 12px; font-weight: 750; }
.profile-identity { display: flex; flex-direction: column; text-align: left; line-height: 1.4; max-width: 180px; }
.profile-identity strong { font-size: 12px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.profile-identity small { font-size: 10px; font-weight: 400; color: #8b7a9a; }
.profile-chevron { color: #8b7a9a; transition: transform .2s; }
.profile-menu[open] .profile-chevron { transform: rotate(180deg); }
.profile-dropdown { position: absolute; top: calc(100% + 8px); right: 0; z-index: 70; width: 220px; padding: 7px; background: var(--color-base-100); color: var(--color-base-content); border: 1px solid var(--color-base-300); border-radius: 12px; box-shadow: 0 12px 32px #21153815; }
.profile-dropdown button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; font-size: 13px; text-align: left; border-radius: 7px; }
.profile-dropdown button:hover { background: var(--color-base-200); }
.logout-item { border-top: 1px solid var(--color-base-300); margin-top: 4px; padding-top: 4px; color: #bb3e53; }
.profile-overview { display: flex; align-items: center; gap: 14px; margin: 0 0 24px; }
.profile-avatar-large { width: 48px; height: 48px; font-size: 16px; }
.profile-overview h4 { font-size: 17px; font-weight: 700; margin: 0; }
.profile-overview p { font-size: 12px; color: #8b7a9a; margin: 5px 0 0; }
.profile-fields { margin: 0; display: grid; gap: 18px; }
.profile-fields dt { color: #8b7a9a; font-size: 11px; margin-bottom: 6px; }
.profile-fields dd { font-size: 13px; margin: 0; overflow-wrap: anywhere; }
.profile-roles { display: flex; flex-wrap: wrap; gap: 6px; }
@media(max-width: 760px) { .header { padding: 10px 14px; gap: 10px; } .left-section { gap: 9px; } .page-title { font-size: 16px; } .profile-identity { display: none; } .profile-trigger { gap: 7px; } }
</style>
