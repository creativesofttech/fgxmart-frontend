<template>
  <v-dialog v-model="dialog" max-width="600" scrollable>
    <v-card class="rounded-lg">
      <div class="d-flex justify-end pa-2">
        <v-btn icon variant="text" @click="dialog = false" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="px-6 pb-2 text-center">
        <h3 class="text-h5 font-weight-bold mb-1">Choose your Delivery Location</h3>
        <p class="text-body-2 text-grey mb-6">Enter your address and we will specify the offer for your area.</p>

        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search Your Area"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-6 rounded-lg"
          bg-color="grey-lighten-5"
          autofocus
        ></v-text-field>
      </div>

      <v-divider></v-divider>

      <div class="px-6 pt-4 pb-2">
        <p class="text-subtitle-2 text-grey mb-2">Select a Location</p>
      </div>

      <v-card-text style="height: 400px;" class="px-0 pt-0">
        <v-list v-if="filteredCountries.length > 0" lines="one">
          <v-list-item
            v-for="country in filteredCountries"
            :key="country.id"
            :value="country"
            @click="selectCountry(country)"
            :active="selectedCountry?.id === country.id"
            color="primary"
            class="px-6 py-3 mb-1"
          >
            <template v-slot:title>
              <span class="text-body-1">{{ country.name }}</span>
            </template>
            
            <template v-slot:append>
              <v-chip
                v-if="selectedCountry?.id === country.id"
                color="primary"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                Selected
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-else class="text-center py-8 text-grey">
          <v-icon icon="mdi-map-search-outline" size="large" class="mb-2"></v-icon>
          <p>No locations found matching "{{ search }}"</p>
        </div>
        
        <div v-if="pending" class="d-flex justify-center align-center h-100">
           <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const search = ref('')
const selectedCountry = ref(null)

// Fetch countries from public API
const { data: countriesData, pending } = await useFetch('http://localhost:8000/api/v1/countries?all=1')

const countries = computed(() => {
  return countriesData.value?.data || []
})

const filteredCountries = computed(() => {
  if (!search.value) return countries.value
  const query = search.value.toLowerCase()
  return countries.value.filter(c => c.name.toLowerCase().includes(query))
})

const selectCountry = (country) => {
  selectedCountry.value = country
  emit('select', country)
  dialog.value = false
}
</script>

<style scoped>
.v-list-item--active {
  background-color: rgb(var(--v-theme-primary), 0.1);
}
</style>
