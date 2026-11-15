<template>
  <div class="custom-select">
    <input v-if="searchable && options.length > 8" v-model="query" type="search" class="tw:input select-search" :placeholder="`Search ${placeholder.toLowerCase()}`" aria-label="Search options" />
    <select class="tw:select" :class="{ 'tw:select-error': error }" :value="modelValue ?? ''" :aria-label="placeholder" @change="selectValue">
      <option :value="''" :disabled="!allowEmpty">{{ placeholder }}</option>
      <option v-for="option in filteredOptions" :key="option[valueKey]" :value="option[valueKey]">{{ option[labelKey] }}</option>
    </select>
  </div>
</template>
<script setup>
const props = defineProps({ modelValue: { type: [String, Number], default: null }, options: { type: Array, default: () => [] }, placeholder: { type: String, default: 'Select an option' }, searchable: { type: Boolean, default: true }, labelKey: { type: String, default: 'name' }, valueKey: { type: String, default: 'id' }, error: Boolean, allowEmpty: { type: Boolean, default: true } })
const emit = defineEmits(['update:modelValue', 'change'])
const query = ref('')
const filteredOptions = computed(() => props.options.filter(option => option[props.valueKey] === props.modelValue || String(option[props.labelKey]).toLowerCase().includes(query.value.toLowerCase())))
const selectValue = event => {
  const option = props.options.find(option => String(option[props.valueKey]) === event.target.value)
  const value = option ? option[props.valueKey] : null
  emit('update:modelValue', value); emit('change', value)
}
</script>
<style scoped>

.custom-select { width: 100%; }
.custom-select select, .select-search { width: 100%; }
.select-search { margin-bottom: 8px; }

</style>
