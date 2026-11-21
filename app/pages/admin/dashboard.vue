<template>
  <AdminDashboardOverview />
</template>
<script setup>
import AdminDashboardOverview from '~/components/admin/dashboard/Overview.vue'
definePageMeta({ layout: 'admin' })
useHead({ title: 'Dashboard - FGX MART Admin' })
</script>
