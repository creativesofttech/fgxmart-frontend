<template>
  <div class="app-select" data-theme="fgx" :class="{ 'select-disabled': disabled, 'select-invalid': invalidMessage || error }">
    <label v-if="label && !hideLabel" class="select-label" :for="controlId">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
    <button :id="controlId" ref="trigger" class="select-trigger" type="button" role="combobox" :aria-label="ariaLabel || label || placeholder" :aria-expanded="opened" :aria-controls="listId" aria-haspopup="listbox" :aria-required="required || undefined" :aria-invalid="Boolean(error || invalidMessage) || undefined" :aria-describedby="invalidMessage || typeof error === 'string' ? `${controlId}-error` : undefined" :aria-activedescendant="opened && !hasSearch && activeIndex >= 0 ? `${controlId}-option-${activeIndex}` : undefined" :disabled="disabled" @click.stop="toggle" @keydown="onKeydown">
      <span class="select-value" :class="{ 'select-placeholder': !selected }">{{ selected?.label || placeholder }}</span><ChevronDown :size="16" class="select-chevron" :class="{ 'is-open': opened }" aria-hidden="true" />
    </button>
    <input v-if="required || name" class="select-validation-proxy" :value="selected ? String(selected.value) : ''" :name="name" :required="required" :disabled="disabled" tabindex="-1" aria-hidden="true" @invalid.prevent="onInvalid" />
    <p v-if="invalidMessage || typeof error === 'string'" :id="`${controlId}-error`" class="select-error" role="alert">{{ invalidMessage || error }}</p>
    <div v-if="opened" ref="panel" popover="manual" class="select-popover" data-theme="fgx" @keydown="onKeydown" @click.stop>
      <div v-if="hasSearch" class="select-search-wrap"><Search :size="16" aria-hidden="true" /><input ref="searchInput" v-model="query" class="select-search" type="search" role="combobox" :aria-label="`Search ${label || placeholder}`" :aria-controls="listId" aria-expanded="true" :aria-activedescendant="activeIndex >= 0 ? `${controlId}-option-${activeIndex}` : undefined" autocomplete="off" placeholder="Search options…" /></div>
      <ul :id="listId" ref="list" class="select-options" role="listbox" :aria-label="label || ariaLabel || placeholder">
        <template v-for="(option, index) in displayedOptions" :key="option.key">
          <li v-if="option.group && option.group !== displayedOptions[index - 1]?.group" class="select-group" role="presentation">{{ option.group }}</li>
          <li :id="`${controlId}-option-${index}`" role="option" :aria-selected="sameValue(option.value, modelValue)" :aria-disabled="option.disabled || undefined" class="select-option" :class="{ 'option-active': activeIndex === index, 'option-selected': sameValue(option.value, modelValue), 'option-disabled': option.disabled }" @pointermove="!option.disabled && (activeIndex = index)" @pointerdown.prevent @click.stop.prevent="choose(option)"><span class="option-copy"><span>{{ option.label }}</span><small v-if="option.description">{{ option.description }}</small></span><Check v-if="sameValue(option.value, modelValue)" :size="15" aria-hidden="true" /></li>
        </template>
        <li v-if="!displayedOptions.length" role="presentation" class="select-no-results">No options found</li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { Check, ChevronDown, Search } from 'lucide-vue-next'
defineOptions({ inheritAttrs: true })
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  options: { type: Array, default: () => [] },
  labelKey: { type: String, default: 'name' }, valueKey: { type: String, default: 'id' },
  label: { type: String, default: '' }, hideLabel: Boolean, ariaLabel: { type: String, default: '' },
  id: { type: String, default: '' }, name: { type: String, default: '' },
  placeholder: { type: String, default: 'Select an option' },
  searchable: { type: Boolean, default: true }, disabled: Boolean, required: Boolean,
  allowEmpty: { type: Boolean, default: true }, emptyLabel: { type: String, default: 'Clear selection' },
  emptyValue: { default: null }, error: { type: [Boolean, String], default: false },
})
const emit = defineEmits(['update:modelValue', 'change', 'blur', 'invalid'])
const generatedId = useId()
const controlId = computed(() => props.id || `select-${generatedId}`)
const listId = computed(() => `${controlId.value}-list`)
const trigger = ref(null), panel = ref(null), searchInput = ref(null), list = ref(null)
const opened = ref(false), query = ref(''), activeIndex = ref(-1), invalidMessage = ref('')
let typeahead = '', typeaheadTimer
const sameValue = (a, b) => a === b || (a != null && b != null && String(a) === String(b))
const normalized = computed(() => props.options.map((option, index) => typeof option === 'object' && option !== null
  ? { key: `option-${index}`, label: String(option[props.labelKey] ?? option.label ?? ''), value: option[props.valueKey] ?? option.value, disabled: Boolean(option.disabled), group: option.group, description: option.description }
  : { key: `option-${index}`, label: String(option), value: option, disabled: false }))
const selected = computed(() => normalized.value.find(option => sameValue(option.value, props.modelValue)))
const hasSearch = computed(() => props.searchable && normalized.value.length > 7)
const displayedOptions = computed(() => {
  const term = query.value.trim().toLowerCase()
  const matches = normalized.value.filter(option => !term || `${option.label} ${option.group || ''}`.toLowerCase().includes(term))
  return props.allowEmpty && !props.required && !term ? [{ key: 'empty', label: props.emptyLabel, value: props.emptyValue, disabled: false }, ...matches] : matches
})
const validate = () => { invalidMessage.value = props.required && !selected.value ? `Please select ${props.label ? props.label.toLowerCase() : 'an option'}.` : ''; return !invalidMessage.value }
const focus = () => trigger.value?.focus()
const resetValidation = () => { invalidMessage.value = '' }
defineExpose({ validate, focus, resetValidation })
const reposition = () => {
  if (!opened.value || !panel.value || !trigger.value) return
  const anchor = trigger.value.getBoundingClientRect()
  const viewportHeight = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : innerHeight
  const viewportWidth = document.documentElement.clientWidth
  const below = viewportHeight - anchor.bottom - 14, above = anchor.top - 14
  const upward = below < 210 && above > below
  const width = Math.min(Math.max(anchor.width, 180), viewportWidth - 24)
  Object.assign(panel.value.style, { width: `${width}px`, maxHeight: `${Math.min(330, Math.max(100, upward ? above : below))}px` })
  const height = panel.value.getBoundingClientRect().height
  Object.assign(panel.value.style, { left: `${Math.max(12, Math.min(anchor.left, viewportWidth - width - 12))}px`, top: `${Math.max(8, upward ? anchor.top - height - 6 : anchor.bottom + 6)}px` })
}
const close = (restoreFocus = false) => {
  if (!opened.value) return
  if (panel.value?.matches(':popover-open')) panel.value.hidePopover()
  opened.value = false; query.value = ''; activeIndex.value = -1
  if (restoreFocus) focus()
  emit('blur')
}
const open = async (last = false) => {
  if (props.disabled || opened.value) return
  opened.value = true; query.value = ''
  const selectedIndex = displayedOptions.value.findIndex(option => sameValue(option.value, props.modelValue) && !option.disabled)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : last ? displayedOptions.value.findLastIndex(option => !option.disabled) : displayedOptions.value.findIndex(option => !option.disabled)
  await nextTick()
  if (!opened.value || !panel.value) return
  panel.value.showPopover(); reposition()
  if (hasSearch.value) searchInput.value?.focus()
  scrollActive()
}
const toggle = () => opened.value ? close() : open()
const scrollActive = () => nextTick(() => {
  const option = document.getElementById(`${controlId.value}-option-${activeIndex.value}`)
  if (!option || !list.value) return
  const bounds = option.getBoundingClientRect(), viewport = list.value.getBoundingClientRect()
  if (bounds.top < viewport.top) list.value.scrollTop -= viewport.top - bounds.top
  else if (bounds.bottom > viewport.bottom) list.value.scrollTop += bounds.bottom - viewport.bottom
})
const choose = option => {
  if (!option || option.disabled) return
  invalidMessage.value = ''
  emit('update:modelValue', option.value); emit('change', option.value)
  close(true)
}
const move = step => {
  const options = displayedOptions.value
  if (!options.length || !options.some(option => !option.disabled)) return
  let next = activeIndex.value
  for (let count = 0; count < options.length; count++) { next = (next + step + options.length) % options.length; if (!options[next].disabled) break }
  activeIndex.value = next; scrollActive()
}
const onKeydown = async event => {
  if (props.disabled) return
  if (!opened.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); await open(event.key === 'ArrowUp') }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); await open(); typeToFind(event.key) }
    return
  }
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true) }
  else if (event.key === 'Tab') close(true)
  else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : -1) }
  else if (event.key === 'Home' || event.key === 'End') { if (event.target !== searchInput.value) { event.preventDefault(); activeIndex.value = event.key === 'Home' ? displayedOptions.value.findIndex(option => !option.disabled) : displayedOptions.value.findLastIndex(option => !option.disabled); scrollActive() } }
  else if (event.key === 'Enter' || (event.key === ' ' && event.target !== searchInput.value)) { event.preventDefault(); choose(displayedOptions.value[activeIndex.value]) }
  else if (event.key.length === 1 && event.target !== searchInput.value && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); typeToFind(event.key) }
}
const typeToFind = key => {
  if (hasSearch.value) { query.value += key; return }
  clearTimeout(typeaheadTimer); typeahead += key.toLowerCase()
  const found = displayedOptions.value.findIndex(option => !option.disabled && option.label.toLowerCase().startsWith(typeahead))
  if (found >= 0) { activeIndex.value = found; scrollActive() }
  typeaheadTimer = setTimeout(() => { typeahead = '' }, 650)
}
const onInvalid = () => { validate(); focus(); emit('invalid') }
const onOutside = event => { if (!trigger.value?.contains(event.target) && !panel.value?.contains(event.target)) close() }
const onScroll = event => { if (opened.value && !panel.value?.contains(event.target)) reposition() }
watch(query, () => { activeIndex.value = displayedOptions.value.findIndex(option => !option.disabled); nextTick(reposition) })
watch(() => props.modelValue, () => { if (selected.value) invalidMessage.value = '' })
watch(() => props.disabled, disabled => { if (disabled) close() })
const route = useRoute()
watch(() => route.fullPath, () => close())
onMounted(() => { document.addEventListener('pointerdown', onOutside, true); document.addEventListener('scroll', onScroll, true); window.addEventListener('resize', reposition); window.visualViewport?.addEventListener('resize', reposition) })
onBeforeUnmount(() => { close(); clearTimeout(typeaheadTimer); document.removeEventListener('pointerdown', onOutside, true); document.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', reposition); window.visualViewport?.removeEventListener('resize', reposition) })
</script>
<style scoped>
.app-select { position: relative; min-width: 0; width: 100%; color: #39264d; font-family: var(--app-font-family); }
.select-label { display: block; margin-bottom: 7px; font-size: 13px; font-weight: 600; color: #746181; }
.select-label > span { color: #bc4764; }
.select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-width: 0; min-height: 42px; padding: 10px 13px; border: 1px solid #dfd5eb; border-radius: 10px; background: #fff; color: #39264d; cursor: pointer; font-size: 13px; text-align: left; line-height: 1.5; transition: border-color .15s, box-shadow .15s; }
.select-trigger:hover { border-color: #bba4d4; }
.select-trigger:focus-visible { outline: 2px solid #8b5bc0; outline-offset: 3px; }
.select-trigger[aria-expanded=true] { border-color: #a477cd; box-shadow: 0 0 0 3px #8b5bc00d; }
.select-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-placeholder { color: #a18eae; font-weight: 400; }
.select-chevron { flex-shrink: 0; color: #a18cb3; transition: transform .15s; }
.select-chevron.is-open { transform: rotate(180deg); }
.select-disabled .select-trigger { opacity: .55; cursor: not-allowed; background: #f8f5fb; }
.select-invalid .select-trigger { border-color: #d48196; }
.select-error { margin: 6px 0 0; color: #b34b68; font-size: 11px; line-height: 1.5; }
.select-validation-proxy { position: absolute; width: 1px; height: 1px; padding: 0; border: 0; overflow: hidden; clip: rect(0, 0, 0, 0); opacity: 0; pointer-events: none; }
.select-popover { position: fixed; inset: auto; margin: 0; padding: 6px; display: flex; flex-direction: column; border: 1px solid #e3d8ef; border-radius: 12px; background: #fff; color: #39264d; box-shadow: 0 12px 35px #35204c20; overflow: hidden; font-family: var(--app-font-family); }
.select-popover:not(:popover-open) { display: none; }
.select-search-wrap { display: flex; align-items: center; gap: 9px; flex-shrink: 0; margin: 2px 3px 6px; padding: 8px 9px; border: 1px solid #e9e0f3; border-radius: 7px; color: #a18cb3; }
.select-search { width: 0; min-width: 0; flex: 1; border: 0; outline: 0; background: #fff; color: #493253; padding: 0; font-size: 12px; line-height: 1.5; }
.select-search::-webkit-search-cancel-button { cursor: pointer; }
.select-options { display: flex; flex-direction: column; flex-wrap: nowrap; width: 100%; min-height: 0; margin: 0; padding: 0; overflow-y: auto; overscroll-behavior: contain; list-style: none; gap: 2px; }
.select-option { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; min-height: 38px; padding: 9px 11px; border-radius: 7px; cursor: pointer; font-size: 12px; line-height: 1.5; font-weight: 450; list-style: none; color: #6b537c; text-align: left; }
.select-option.option-active { background: #f5f0fb; color: #6c3e9d; }
.select-option.option-selected { background: #eee5f8; color: #7243a3; font-weight: 600; }
.select-option.option-disabled { opacity: .4; cursor: not-allowed; }
.select-option > .option-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; align-items: flex-start; padding: 0; text-align: left; }
.option-copy > span { overflow-wrap: anywhere; }
.option-copy small { color: #a18cb3; font-size: 10px; margin-top: 2px; }
.select-option > svg { flex-shrink: 0; }
.select-group { padding: 10px 11px 5px; list-style: none; color: #a18cb3; font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
.select-no-results { padding: 14px 11px; list-style: none; color: #a18cb3; font-size: 12px; }
@media(prefers-reduced-motion: reduce) { .select-trigger, .select-chevron { transition: none; } }
</style>
