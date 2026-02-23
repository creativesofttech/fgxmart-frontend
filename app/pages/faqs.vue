<template>
  <div class="faqs-page bg-grey-lighten-4 py-16 min-h-screen">
    <v-container class="custom-container">
      <!-- Header Section -->
      <div class="text-center mb-16">
        <h1 class="text-h2 font-weight-black text-grey-darken-4 mb-4">Have Any Question?</h1>
        <p class="text-h6 text-grey-darken-1 font-weight-medium mx-auto" style="max-width: 700px;">
          Explore our frequently asked questions to find quick answers. We are dedicated to providing you with comprehensive support for all your inquiries.
        </p>
      </div>

      <!-- FAQ Section -->
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-grey">Loading our help guides...</p>
          </div>

          <v-expansion-panels 
            v-else-if="activeFaqs.length > 0"
            v-model="activePanel"
            variant="inset"
            class="faq-panels"
          >
            <v-expansion-panel
              v-for="faq in activeFaqs"
              :key="faq.id"
              class="rounded-xl mb-4 border overflow-hidden shadow-sm"
              elevation="0"
            >
              <v-expansion-panel-title class="py-6 px-8">
                <template v-slot:default="{ expanded }">
                  <div class="d-flex align-center w-100">
                    <div 
                        class="faq-icon-box rounded-lg mr-4 d-flex align-center justify-center"
                        :class="expanded ? 'bg-primary text-white' : 'bg-grey-lighten-4 text-primary'"
                        style="width: 40px; height: 40px; transition: all 0.3s;"
                    >
                      <v-icon :icon="expanded ? 'mdi-minus' : 'mdi-help-circle-outline'" size="20"></v-icon>
                    </div>
                    <span class="text-h6 font-weight-bold text-grey-darken-4 pr-4 panel-title">{{ faq.title }}</span>
                  </div>
                </template>
                <template v-slot:actions="{ expanded }">
                   <!-- Custom actions or leave empty to use icon in default slot -->
                </template>
              </v-expansion-panel-title>

              <v-expansion-panel-text class="px-8 pb-6 text-grey-darken-1">
                <div class="faq-answer-wrapper pt-2 border-t">
                  <p class="text-body-1 leading-relaxed">{{ faq.description }}</p>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Empty State -->
          <v-card v-else class="text-center py-16 bg-white border rounded-xl" elevation="0">
            <v-icon icon="mdi-help-box" size="80" color="grey-lighten-2" class="mb-6"></v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">No FAQs Available</h3>
            <p class="text-grey mb-8">We are currently updating our knowledge base. Please check back later.</p>
            <v-btn to="/" color="primary" rounded="lg" class="px-10 text-none" height="48">Return Home</v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Support CTA -->
      <div class="text-center mt-16">
        <v-card color="primary" class="rounded-xl pa-10 text-white overflow-hidden position-relative shadow-lg" elevation="0">
          <div class="z-10 position-relative">
            <h2 class="text-h4 font-weight-bold mb-4">Still have questions?</h2>
            <p class="text-h6 mb-8 opacity-80">Our support team is ready to assist you dynamicly.</p>
            <div class="d-flex flex-wrap justify-center gap-4">
              <v-btn color="white" variant="flat" rounded="lg" class="text-none font-weight-bold px-8 text-primary" height="54">
                <v-icon icon="mdi-email-outline" class="mr-2"></v-icon>
                Contact Support
              </v-btn>
              <v-btn color="white" variant="outlined" rounded="lg" class="text-none font-weight-bold px-8" height="54">
                <v-icon icon="mdi-phone-outline" class="mr-2"></v-icon>
                Call Us Now
              </v-btn>
            </div>
          </div>
          <!-- Decorative circle -->
          <div class="position-absolute" style="top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        </v-card>
      </div>
    </v-container>
  </div>
</template>

<script setup>
const faqs = ref([])
const loading = ref(true)
const activePanel = ref(0) // First panel active by default

const config = useRuntimeConfig()

const activeFaqs = computed(() => faqs.value.filter(f => f.status))

const fetchFaqs = async () => {
  loading.value = true
  try {
    const response = await $fetch(`${config.public.apiBase}/faqs`)
    faqs.value = response.data
  } catch (err) {
    console.error('Error fetching FAQs:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFaqs()
})

useHead({
  title: 'Frequently Asked Questions - FGXMART',
  meta: [
    { name: 'description', content: 'Find quick answers for your queries about our services, products, and more in the FGXMART Help Center.' }
  ]
})
</script>

<style scoped lang="scss">
.faqs-page {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.faq-panels {
  :deep(.v-expansion-panel-title) {
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.02);
    }
  }
  
  :deep(.v-expansion-panel--active) {
    .v-expansion-panel-title {
        background-color: #fff;
    }
    .panel-title {
        color: rgb(var(--v-theme-primary)) !important;
    }
  }
}

.faq-icon-box {
  flex-shrink: 0;
}

.panel-title {
    transition: color 0.3s;
}

.gap-4 {
    gap: 16px;
}

.z-10 {
    z-index: 10;
}
</style>
