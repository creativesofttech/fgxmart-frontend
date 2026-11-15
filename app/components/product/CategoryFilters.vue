<template>
  <div class="category-filters">
    <button class="all-products" type="button" :aria-pressed="!modelValue.length" @click="$emit('update:modelValue', [])">All Products</button>
    <ul class="category-roots">
      <li v-for="category in roots" :key="category.id" class="category-root">
        <div class="category-filter-row">
          <label><input class="tw:checkbox tw:checkbox-primary" type="checkbox" :checked="selected(category.id)" :indeterminate="!selected(category.id) && children(category).some(child => selected(child.id))" @change="toggleParent(category, $event.target.checked)" /><span>{{ category.name }}</span></label>
          <button v-if="children(category).length" class="category-caret" type="button" :aria-label="`${expanded.includes(category.id) ? 'Collapse' : 'Expand'} ${category.name} subcategories`" :aria-expanded="expanded.includes(category.id)" :aria-controls="`filter-children-${category.id}`" @click="toggleExpanded(category.id)"><ChevronDown :size="16" :class="{ rotated: expanded.includes(category.id) }" aria-hidden="true" /></button>
        </div>
        <ul v-if="children(category).length && expanded.includes(category.id)" :id="`filter-children-${category.id}`" class="category-children">
          <li v-for="child in children(category)" :key="child.id"><label><input class="tw:checkbox tw:checkbox-primary" type="checkbox" :checked="selected(category.id) || selected(child.id)" @change="toggleChild(category, child, $event.target.checked)" /><span>{{ child.name }}</span></label></li>
        </ul>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { ChevronDown } from 'lucide-vue-next'
const props = defineProps({ modelValue: { type: Array, default: () => [] }, categories: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])
const expanded = ref([])
const roots = computed(() => props.categories.filter(category => !category.parent_id && category.status !== false))
const children = category => (category.children || []).filter(child => child.status !== false)
const selected = id => props.modelValue.includes(id)
const toggleExpanded = id => { expanded.value = expanded.value.includes(id) ? expanded.value.filter(value => value !== id) : [...expanded.value, id] }
const toggleParent = (category, checked) => {
  const family = [category.id, ...children(category).map(child => child.id)]
  const next = props.modelValue.filter(id => !family.includes(id))
  emit('update:modelValue', checked ? [...next, category.id] : next)
}
const toggleChild = (category, child, checked) => {
  let next = props.modelValue.filter(id => id !== category.id && id !== child.id)
  // Narrowing a selected parent retains its other children, rather than resetting them.
  if (selected(category.id)) next = [...next, ...children(category).filter(item => item.id !== child.id).map(item => item.id)]
  if (checked) next.push(child.id)
  emit('update:modelValue', [...new Set(next)])
}
</script>
<style scoped>
.category-filters { color: #4d3c60; }
.all-products { display: block; width: 100%; border: 0; border-radius: 8px; padding: 11px 12px; text-align: left; font-size: 13px; color: #755b91; background: #faf8fc; cursor: pointer; margin-bottom: 10px; }
.all-products[aria-pressed=true] { color: #513380; background: #eee7f7; font-weight: 650; }
.category-roots, .category-children { list-style: none; margin: 0; padding: 0; }
.category-root + .category-root { margin-top: 4px; }
.category-filter-row { display: flex; align-items: center; gap: 8px; min-height: 43px; }
.category-filters label { display: flex; flex: 1; align-items: center; gap: 11px; padding: 9px 0; min-width: 0; font-size: 13px; line-height: 1.5; cursor: pointer; }
.category-filters label span { overflow-wrap: anywhere; }
.category-filters input { appearance: none; width: 18px; height: 18px; flex-shrink: 0; border: 1px solid #cdbedd; border-radius: 4px; background-color: white; color: white; }
.category-filters input:checked, .category-filters input:indeterminate { background-color: #513380; border-color: #513380; }
.category-caret { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 7px; color: #806792; background: transparent; cursor: pointer; flex-shrink: 0; }
.category-caret:hover { background: #f1ebf8; }
.category-caret svg { transition: transform .15s; }
.category-caret .rotated { transform: rotate(180deg); }
.category-children { padding-left: 29px; }
.category-children label { color: #8a769c; font-size: 12px; }
@media(prefers-reduced-motion:reduce) { .category-caret svg { transition: none; } }
</style>
