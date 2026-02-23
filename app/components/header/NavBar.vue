<template>
  <v-sheet class="border-b" height="60" color="white">
    <v-container class="custom-container d-flex align-center h-100 py-0 px-4">
      <!-- Categories Button (Blue) -->
      <v-menu
        location="bottom start"
        offset="5"
        transition="slide-y-transition"
        :close-on-content-click="false"
        open-on-hover
      >
        <template v-slot:activator="{ props }">
          <v-btn
            color="primary"
            class="text-none px-6 mr-8 text-white min-w-200"
            height="45"
            rounded="lg"
            elevation="0"
            style="font-weight: 600 !important; font-family: inherit !important;"
            v-bind="props"
          >
            <v-icon icon="mdi-menu" class="mr-3" />
            All Categories
          </v-btn>
        </template>

        <v-card width="300" class="py-2" elevation="5" border>
          <div v-if="pending" class="d-flex justify-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <v-list v-else lines="one" density="compact" class="py-0">
             <v-list-item
               v-for="category in categories"
               :key="category.id"
               :title="category.name"
               :to="`/category/${category.slug}`"
               class="px-4 py-2 hover-bg-grey"
               active-class="text-secondary font-weight-bold"
               rounded="0"
             >
                <template v-slot:prepend>
                  <v-avatar size="32" class="mr-3 rounded-0">
                    <v-img 
                      :src="getCategoryImageUrl(category.image)" 
                      :alt="category.name"
                      cover
                    ></v-img>
                  </v-avatar>
                </template>
             </v-list-item>
          </v-list>
        </v-card>
      </v-menu>

      <!-- Nav Links -->
      <div class="d-none d-md-flex align-center gap-6">
        <v-btn to="/" variant="text" class="nav-link" active-class="active-link" :ripple="false">Home</v-btn>
        <v-btn to="/products" variant="text" class="nav-link" active-class="active-link" :ripple="false">Products</v-btn>
        
        <!-- Dynamic Header Pages -->
        <v-btn 
          v-for="page in headerPages" 
          :key="page.id"
          :to="`/${page.slug}`"
          variant="text" 
          class="nav-link" 
          active-class="active-link"
          :ripple="false"
        >
          {{ page.title }}
        </v-btn>
      </div>

      <v-spacer />

      <!-- Deal Today (Blue Tonal) -->
      <v-btn
        color="primary"
        variant="tonal"
        class="text-none font-weight-bold"
        rounded="lg"
        height="40"
      >
        <v-icon icon="mdi-lightning-bolt" class="mr-2" />
        Deal Today
      </v-btn>
    </v-container>
  </v-sheet>
</template>

<script setup>
const { data: categoriesData, pending } = await useFetch('http://localhost:8000/api/v1/categories?all=1')

const categories = computed(() => {
  return categoriesData.value?.data || []
})

const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/40' // Placeholder
  // Assuming Laravel storage link is accessible at /storage
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:8000/storage/${imagePath}`
}

// Fetch Dynamic Pages
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:8000/api/v1'
const { data: pagesRes } = await useFetch(`${apiBase}/pages`)
const pages = computed(() => pagesRes.value?.data || [])
const headerPages = computed(() => pages.value.filter(p => p.position === 'header' || p.position === 'both'))
</script>

<style scoped>
.gap-6 {
  gap: 24px;
}
.hover-bg-grey:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}
.min-w-200 {
  min-width: 200px;
}
.nav-link {
  text-transform: none !important;
  font-family: inherit !important;
  font-weight: 600 !important;
  color: #4a5568 !important;
  letter-spacing: 0 !important;
  font-size: 16px !important;
}
.active-link {
  color: #087637 !important; /* FGX Green */
}
.nav-link :deep(.v-btn__overlay) {
  display: none !important;
}
</style>
