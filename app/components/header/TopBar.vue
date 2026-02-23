<template>
  <v-sheet color="primary" class="py-2 text-caption text-sm-body-2" rounded="0">
    <v-container class="custom-container d-flex justify-space-between align-center py-0 px-4">
      <!-- Left Section -->
      <div class="d-flex align-center">
        <v-icon icon="mdi-map-marker" size="small" class="mr-2" />
        <span class="text-truncate" style="max-width: 200px;">1418 Riverwood Drive, CA 96052, US</span>
      </div>

      <!-- Center Section -->
      <div class="d-none d-md-flex text-center flex-grow-1 justify-center">
        <span>
          Welcome to FGXMART! Wrap new offers/gift every single day on Weekends.
          <strong class="ml-1">New Coupon Code: MART024</strong>
        </span>
      </div>

      <!-- Right Section -->
      <div class="d-flex align-center">
        <!-- Language Dropdown -->
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              variant="text"
              density="compact"
              class="text-none px-1 text-white"
              v-bind="props"
              height="auto"
            >
              <img src="/flags/us.svg" alt="US" class="mr-2" style="width: 18px; height: 12px; object-fit: cover; border-radius: 2px;" />
              English
              <v-icon icon="mdi-chevron-down" size="small" class="ml-1" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item value="en" title="English" />
            <v-list-item value="fr" title="Français" />
          </v-list>
        </v-menu>

        <!-- Vertical Divider -->
        <v-divider vertical class="mx-2 my-1 bg-white opacity-20" length="15" />

        <!-- Currency Dropdown -->
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
             <v-btn
              variant="text"
              density="compact"
              class="text-none px-1 text-white"
              v-bind="props"
              height="auto"
            >
              USD
              <v-icon icon="mdi-chevron-down" size="small" class="ml-1" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item value="usd" title="USD" />
            <v-list-item value="eur" title="EUR" />
          </v-list>
        </v-menu>
      </div>
    </v-container>
  </v-sheet>
</template>

<script setup>
// Icons are handled by Vuetify MDI integration
</script>

<style scoped>
/* Optional overrides if needed */
</style>
