<template>
  <div class="dynamic-page">
    <div v-if="loading" class="loading-state py-16 text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-4 text-grey">Loading page content...</p>
    </div>

    <div v-else-if="page" class="page-content">
      <!-- Logic to loop through blocks -->
      <div v-for="(block, index) in page.content" :key="index">
        <!-- Render Hero Section -->
        <section v-if="block.type === 'HeroSection'" class="hero-block bg-primary-dark text-white py-16">
          <v-container class="custom-container">
            <v-row align="center">
              <v-col cols="12" md="8">
                <h1 class="text-h4 font-weight-black mb-4">{{ block.data.title }}</h1>
                <p class="text-h6 opacity-80">{{ block.data.subtitle }}</p>
              </v-col>
            </v-row>
          </v-container>
        </section>

        <!-- Render Rich Text Section -->
        <section v-else-if="block.type === 'RichText'" class="rich-text-block py-16">
          <v-container class="custom-container">
            <div class="prose max-w-none" v-html="block.data.html"></div>
          </v-container>
        </section>

        <!-- Fallback for unknown blocks -->
        <div v-else class="py-8 text-center text-grey italic">
           <!-- Block type {{ block.type }} not yet implemented on frontend -->
        </div>
      </div>
    </div>

    <!-- 404 State -->
    <v-container v-else class="custom-container py-16 text-center">
      <v-icon icon="mdi-file-remove-outline" size="80" color="grey-lighten-2" class="mb-6"></v-icon>
      <h3 class="text-h4 font-weight-bold mb-4">Page Not Found</h3>
      <p class="text-grey mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <v-btn to="/" color="primary" rounded="lg">Return Home</v-btn>
    </v-container>
  </div>
</template>

<script setup>
const route = useRoute()
const config = useRuntimeConfig()

const page = ref(null)
const loading = ref(true)

const fetchPage = async () => {
  loading.value = true
  try {
    const response = await $fetch(`${config.public.apiBase}/pages/${route.params.slug}`)
    page.value = response.data
  } catch (err) {
    console.error('Error fetching dynamic page:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPage()
})

// Set SEO Meta
watch(page, (newPage) => {
  if (newPage) {
    useHead({
      title: `${newPage.title} - FGXMART`,
      meta: [
        { name: 'description', content: newPage.meta_description || '' }
      ]
    })
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.hero-block {
    background-color: var(--theme-blue);
}

.prose {
    line-height: 1.8;
    font-size: 1.1rem;
    color: #334155;
    
    :deep(h1), :deep(h2), :deep(h3) {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-weight: 700;
        color: #0f172a;
    }
    
    :deep(p) {
        margin-bottom: 1.5rem;
    }

    :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 0.75rem;
        margin: 1.5rem 0;
        display: block;
    }
}
</style>
