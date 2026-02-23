<template>
  <v-container class="custom-container py-8">
    <h3 class="text-h5 font-weight-bold mb-6 text-grey-darken-4">Browse By Categories</h3>
    
    <div v-if="pending" class="d-flex justify-center pa-8">
       <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Scrollable container for horizontally scrolling categories -->
    <div 
      v-else-if="categories.length > 0"
      class="d-flex overflow-x-auto pb-4 gap-4 hide-scrollbar"
    >
      <v-card
        v-for="category in categories"
        :key="category.id"
        :to="`/category/${category.slug}`"
        class="flex-shrink-0 d-flex flex-column align-center justify-center pa-6 category-card"
        width="140"
        height="140"
        elevation="0"
        color="grey-lighten-5"
        link
      >
        <div class="image-wrapper mb-3">
           <v-img 
            :src="getCategoryImageUrl(category.image)" 
            :alt="category.name"
            width="50"
            height="50"
            cover
            class="category-image"
          ></v-img>
        </div>
        <span class="text-subtitle-2 text-center text-grey-darken-3 text-truncate w-100">
          {{ category.name }}
        </span>
      </v-card>
    </div>

    <div v-else class="text-center py-8 text-grey">
      No categories found.
    </div>
  </v-container>
</template>

<script setup>
const { data: categoriesData, pending } = await useFetch('http://localhost:8000/api/v1/categories?all=1')

const categories = computed(() => {
  return categoriesData.value?.data || []
})

const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/50' 
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:8000/storage/${imagePath}`
}
</script>

<style scoped>
.gap-4 {
  gap: 16px;
}

.category-card {
  transition: all 0.3s ease;
  border: 1px solid transparent;
  font-family: "Trebuchet MS", sans-serif;
}

.category-card span {
  font-weight: 500 !important;
}

.category-card:hover {
  transform: translateY(-5px);
  background-color: white !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
}

.category-card:hover span {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Hide scrollbar but allow functionality */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
