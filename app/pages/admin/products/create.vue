<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Create New Product</h1>
      <div class="header-actions">
        <NuxtLink to="/admin/products" class="btn-secondary tw:btn tw:btn-sm tw:btn-outline">Cancel</NuxtLink>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Product' }}
        </button>
      </div>
    </div>
    <div class="product-grid">
      <!-- Left Column: Basic Info -->
      <div class="grid-main">
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">General Information</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Product Name <span class="required">*</span></label>
              <input v-model="formData.name" type="text" class="form-input tw:input" placeholder="Enter product name">
            </div>
            <div class="row">
              <div class="form-group col">
                <label>SKU (Auto-generated)</label>
                <input v-model="formData.sku" type="text" class="form-input tw:input" placeholder="e.g. FD-ALM-200-001">
              </div>
              <div class="form-group col">
                <label>Weight / Volume (for SKU)</label>
                <input v-model="formData.variation_code" type="text" class="form-input tw:input" placeholder="e.g. 200, 1KG">
              </div>
            </div>
            <div class="row">
              <div class="form-group col">
                <label>Category</label>
                <CustomSelect
                  v-model="formData.category_id"
                  :options="categories"
                  placeholder="Select Category"
                />
              </div>
              <div class="form-group col">
                <label>Brand</label>
                <CustomSelect
                  v-model="formData.brand_id"
                  :options="brands"
                  placeholder="Select Brand"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Short Summary</label>
              <textarea v-model="formData.summary" class="form-input tw:textarea" rows="3" placeholder="Brief summary of the product"></textarea>
            </div>
            <div class="form-group">
              <label>Description</label>
              <div class="rich-editor">
                <div class="editor-toolbar">
                  <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" @click="execCommand('bold')"><Bold class="ti-icon"/></button>
                  <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" @click="execCommand('italic')"><Italic class="ti-icon"/></button>
                  <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" @click="execCommand('insertUnorderedList')"><List class="ti-icon"/></button>
                  <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" @click="execCommand('insertOrderedList')"><ListOrdered class="ti-icon"/></button>
                </div>
                <div
                  ref="descriptionBox"
                  contenteditable="true"
                  class="editor-content"
                  @input="updateDescription"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">Media Gallery</h2>
            <button class="btn-text tw:btn tw:btn-sm tw:btn-ghost" @click="triggerGalleryUpload">
              <Plus class="icon" /> Add Images
            </button>
          </div>
          <div class="card-body">
            <input
              ref="galleryInput"
              type="file"
              multiple
              accept="image/*"
              class="hidden tw:file-input"
              @change="handleGalleryUpload"
            >

            <div v-if="gallery.length === 0" class="upload-placeholder" @click="triggerGalleryUpload">
              <Upload class="upload-icon" />
              <p>Click to upload multiple images</p>
              <span>SVG, PNG, JPG or GIF (max. 2MB per image)</span>
            </div>
            <div v-else class="gallery-grid">
              <div
                v-for="(img, index) in gallery"
                :key="index"
                class="gallery-item"
                :class="{ 'is-cover': img.isCover }"
              >
                <img :src="img.preview" class="gallery-img">
                <div class="gallery-overlay">
                  <div class="overlay-top">
                    <button class="icon-btn delete tw:btn tw:btn-sm tw:btn-ghost" @click="removeGalleryImage(index)">
                      <Trash2 class="icon" />
                    </button>
                  </div>
                  <div class="overlay-bottom">
                    <button class="icon-btn tw:btn tw:btn-sm tw:btn-ghost" :disabled="index === 0" @click="moveImage(index, -1)">
                      <ArrowLeft class="icon" />
                    </button>
                    <button class="icon-btn tw:btn tw:btn-sm tw:btn-ghost" @click="setAsCover(index)">
                      {{ img.isCover ? 'Cover' : 'Set as Cover' }}
                    </button>
                    <button class="icon-btn tw:btn tw:btn-sm tw:btn-ghost" :disabled="index === gallery.length - 1" @click="moveImage(index, 1)">
                      <ArrowRight class="icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Right Column: Settings -->
      <!-- Right Column: Settings -->
      <div class="grid-side">
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">Pricing & Inventory</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Base Price ($)</label>
              <input v-model="formData.base_price" type="number" class="form-input tw:input" step="0.01">
            </div>
            <div class="form-group">
              <label>Discount Price ($)</label>
              <input v-model="formData.discount_price" type="number" class="form-input tw:input" step="0.01">
            </div>
            <div class="form-group">
              <label>Stock Quantity</label>
              <input v-model="formData.stock_quantity" type="number" class="form-input tw:input">
            </div>
          </div>
        </div>
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">Variations / Attributes</h2>
             <button class="btn-text tw:btn tw:btn-sm tw:btn-ghost" @click="addVariation">
              <Plus class="icon" /> Add Variation
            </button>
          </div>
          <div class="card-body">
            <div v-if="productAttributes.length === 0" class="text-center tw:py-4 text-gray-500">
              No variations added.
            </div>
            <div v-else class="variations-list">
              <div v-for="(item, index) in productAttributes" :key="index" class="variation-item">
                <div class="variation-header">
                   <span class="variation-index">#{{ index + 1 }}</span>
                   <button class="icon-btn delete tw:btn tw:btn-sm tw:btn-ghost" @click="removeVariation(index)">
                      <Trash2 class="icon" />
                   </button>
                </div>

                <div class="form-group tw:mb-2">
                  <label>Attribute Value</label>
                  <select v-model="item.attribute_value_id" class="form-input tw:select">
                    <option :value="null">Select Value</option>
                    <optgroup v-for="attr in attributes" :key="attr.id" :label="attr.name">
                      <option v-for="val in attr.values" :key="val.id" :value="val.id">
                        {{ val.value }}
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div class="row small-gap">
                  <div class="form-group col tw:mb-0">
                    <label class="small-label">Price (+/-)</label>
                    <input v-model="item.price_adjustment" type="number" class="form-input tw:input" step="0.01" placeholder="0.00">
                  </div>
                  <div class="form-group col tw:mb-0">
                     <label class="small-label">Stock</label>
                     <input v-model="item.stock" type="number" class="form-input tw:input">
                  </div>
                </div>
                 <div class="form-group tw:mt-2 tw:mb-0">
                    <label class="small-label">SKU (Optional)</label>
                    <input v-model="item.sku" type="text" class="form-input tw:input" placeholder="Variation SKU">
                 </div>
              </div>
            </div>
          </div>
        </div>
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">Availability Settings</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Shipping Countries</label>
              <div class="multi-select-box">
                <div v-for="country in countries" :key="country.id" class="checkbox-item">
                  <label class="checkbox-container">
                    <input class="tw:checkbox tw:checkbox-primary" type="checkbox" :value="country.id" v-model="formData.countries">
                    <span class="checkmark"></span>
                    <span class="label-text">{{ country.name }} ({{ country.code }})</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="switch-container">
              <span class="switch-label">Product Status (Active)</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status" checked>
                <span class="slider round"></span>
              </label>
            </div>
            <div class="switch-container">
              <span class="switch-label">Featured Product</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.is_featured">
                <span class="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, reactive, watch, onMounted } from 'vue'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Plus,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight
} from 'lucide-vue-next'
import CustomSelect from '~/components/admin/ui/CustomSelect.vue'
import { useAdminToast } from '~/composables/useAdminToast'
const formData = reactive({
  name: '',
  category_id: null,
  brand_id: null,
  sku: '',
  variation_code: '',
  summary: '',
  description: '',
  base_price: 0,
  discount_price: null,
  stock_quantity: 0,
  status: true,
  is_featured: false,
  countries: []
})
const { success, error: toastError } = useAdminToast()
const router = useRouter()
const saving = ref(false)
const categories = ref([])
const brands = ref([])
const countries = ref([])
const attributes = ref([])
const productAttributes = ref([])
const descriptionBox = ref(null)
// SKU Auto-generation logic
watch([() => formData.category_id, () => formData.name, () => formData.variation_code], async ([catId, name, variation]) => {
  if (catId && name && name.length >= 3) {
    let url = `/products/generate-sku?category_id=${catId}&name=${encodeURIComponent(name)}`
    if (variation) url += `&variation=${encodeURIComponent(variation)}`

    // Programmatic fetch to avoid useFetch warning
    try {
      const response = await $adminApi(url)
      if (response && response.sku) {
        formData.sku = response.sku
      }
    } catch (e) {
      console.error('Failed to generate SKU', e)
    }
  }
})
const gallery = ref([])
const galleryInput = ref(null)
const fetchInitialData = async () => {
  try {
    const [cats, brnds, counts, attrs] = await Promise.all([
      useAdminApi('/categories?all=1'),
      useAdminApi('/brands?all=1'),
      useAdminApi('/countries?all=1'),
      useAdminApi('/attributes?all=1')
    ])
    if (cats.data.value) categories.value = cats.data.value.data
    if (brnds.data.value) brands.value = brnds.data.value.data
    if (counts.data.value) countries.value = counts.data.value.data
    if (attrs.data.value) attributes.value = attrs.data.value.data
  } catch (err) {
    console.error('Failed to fetch data', err)
  }
}
const addVariation = () => {
  productAttributes.value.push({
    attribute_value_id: null,
    price_adjustment: 0,
    stock: 0,
    sku: ''
  })
}
const removeVariation = (index) => {
  productAttributes.value.splice(index, 1)
}
const triggerGalleryUpload = () => {
  galleryInput.value.click()
}
const handleGalleryUpload = (e) => {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    gallery.value.push({
      file,
      preview: URL.createObjectURL(file),
      isCover: gallery.value.length === 0
    })
  })
}
const removeGalleryImage = (index) => {
  gallery.value.splice(index, 1)
  if (gallery.value.length > 0 && !gallery.value.some(img => img.isCover)) {
    gallery.value[0].isCover = true
  }
}
const setAsCover = (index) => {
  gallery.value.forEach((img, i) => img.isCover = i === index)
}
const moveImage = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= gallery.value.length) return
  const temp = gallery.value[index]
  gallery.value[index] = gallery.value[newIndex]
  gallery.value[newIndex] = temp
}
const execCommand = (command) => {
  document.execCommand(command, false, null)
}
const updateDescription = () => {
  formData.description = descriptionBox.value.innerHTML
}
const handleSave = async () => {
  if (!formData.name) {
    toastError('Product name is required')
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('name', formData.name)
    fd.append('category_id', formData.category_id || '')
    fd.append('brand_id', formData.brand_id || '')
    fd.append('sku', formData.sku || '')
    fd.append('summary', formData.summary || '')
    fd.append('description', formData.description || '')
    fd.append('base_price', formData.base_price)
    fd.append('discount_price', formData.discount_price || '')
    fd.append('stock_quantity', formData.stock_quantity)
    fd.append('status', formData.status ? '1' : '0')
    fd.append('is_featured', formData.is_featured ? '1' : '0')
    formData.countries.forEach(id => {
      fd.append('countries[]', id)
    })
    // Separate cover from gallery based on flag
    const coverIdx = gallery.value.findIndex(img => img.isCover)
    if (coverIdx !== -1) {
      fd.append('cover_image', gallery.value[coverIdx].file)
    }
    gallery.value.forEach((img, index) => {
      fd.append('gallery[]', img.file)
      // Send sorting order info
      fd.append(`gallery_orders[${index}]`, (index + 1) * 10)
    })
    // Append Variations/Attributes
    productAttributes.value.forEach((attr, index) => {
      if (attr.attribute_value_id) {
        fd.append(`attributes[${index}][attribute_value_id]`, attr.attribute_value_id)
        fd.append(`attributes[${index}][price_adjustment]`, attr.price_adjustment || 0)
        fd.append(`attributes[${index}][stock]`, attr.stock || 0)
        if (attr.sku) fd.append(`attributes[${index}][sku]`, attr.sku)
      }
    })
    const { error: apiErr } = await useAdminApi('/products', {
      method: 'POST',
      body: fd
    })
    if (apiErr.value) {
      toastError(apiErr.value.data?.message || 'Validation error')
      return
    }
    success('Product created successfully')
    router.push('/admin/products')
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    saving.value = false
  }
}
onMounted(() => {
  fetchInitialData()
})
</script>
<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header .title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-base-content);
  margin: 0;
}
.page-header .header-actions {
  display: flex;
  gap: 0.75rem;
}

.product-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
.grid-main, .grid-side {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-card {
  background-color: var(--color-base-100);
  border-radius: 0.75rem;
  border: 1px solid rgb(71 37 128 / 10%);
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgb(71 37 128 / 10%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header .card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-base-content);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #80718d;
  font-size: 0.875rem;
}
.form-group label .required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  transition: all 0.2s;
}
.form-input:focus {
}
.form-input::placeholder {
}

textarea.form-input {
  resize: vertical;
}

.row {
  display: flex;
  gap: 1rem;
}

.col {
  flex: 1;
}

.rich-editor {
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.5rem;
  background-color: var(--color-base-200);
  overflow: hidden;
}
.rich-editor .editor-toolbar {
  padding: 0.5rem;
  background-color: rgb(71 37 128 / 10%);
  border-bottom: 1px solid rgb(71 37 128 / 10%);
  display: flex;
  gap: 0.25rem;
}
.rich-editor .editor-toolbar button {
  transition: all 0.2s;
}
.rich-editor .editor-toolbar button:hover {
}
.rich-editor .editor-toolbar button .ti-icon {
  width: 16px;
}
.rich-editor .editor-content {
  padding: 1rem;
  min-height: 200px;
  color: var(--color-base-content);
  font-size: 0.9375rem;
  outline: none;
}
.rich-editor .editor-content:empty:before {
  content: "Start writing...";
  color: #475569;
}

.upload-placeholder {
  border: 2px dashed rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-placeholder:hover {
  border-color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.02);
}
.upload-placeholder .upload-icon {
  width: 40px;
  height: 40px;
  color: #64748b;
  margin-bottom: 1rem;
}
.upload-placeholder p {
  margin: 0;
  color: var(--color-base-content);
  font-weight: 500;
}
.upload-placeholder span {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
  display: block;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid transparent;
  background-color: var(--color-base-200);
}
.gallery-item.is-cover {
  border-color: var(--color-primary);
}
.gallery-item.is-cover:after {
  content: "COVER";
  position: absolute;
  top: 0;
  left: 0;
  background: var(--color-primary);
  color: white;
  font-size: 0.6rem;
  padding: 0.2rem 0.5rem;
  font-weight: 700;
  border-bottom-right-radius: 4px;
  z-index: 10;
}
.gallery-item .gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.gallery-overlay .overlay-top {
  display: flex;
  justify-content: flex-end;
}
.gallery-overlay .overlay-bottom {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.icon-btn {
  background: rgb(71 37 128 / 10%);
  border: none;
  border-radius: 0.25rem;
  color: var(--color-base-content);
  padding: 0.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}
.icon-btn:hover {
  background: rgb(71 37 128 / 10%);
}
.icon-btn.delete:hover {
  background: #ef4444;
}
.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.icon-btn .icon {
  width: 14px;
  height: 14px;
}

.multi-select-box {
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-item {
  margin-bottom: 0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 0.875rem;
  user-select: none;
  color: #80718d;
}
.checkbox-container input {
  position: absolute;
  width: 0;
}
.checkbox-container input:checked ~ .checkmark {
}
.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}
.checkbox-container .checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 4px;
}
.checkbox-container .checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.checkbox-container:hover input ~ .checkmark {
}

.switch-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.switch-container .switch-label {
  font-size: 0.875rem;
  color: #80718d;
  font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input {
  width: 0;
}
.switch input:checked + .slider {
}
.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-base-200);
  border: 1px solid rgb(71 37 128 / 10%);
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
}
.slider.round {
  border-radius: 24px;
}
.slider.round:before {
  border-radius: 50%;
}

.btn-primary {
  transition: background-color 0.2s;
}
.btn-primary:hover:not(:disabled) {
}
.btn-primary:disabled {
}

.btn-secondary {
  text-decoration: none;
  transition: all 0.2s;
}
.btn-secondary:hover {
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.btn-text:hover {
  text-decoration: underline;
}
.btn-text .icon {
  width: 14px;
}

.hidden {
  display: none;
}

.variations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variation-item {
  background-color: rgb(71 37 128 / 10%);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.5rem;
  padding: 1rem;
}

.variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.variation-header .variation-index {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.small-gap {
  gap: 0.5rem;
}

.small-label {
  font-size: 0.75rem !important;
  margin-bottom: 0.25rem !important;
}
</style>
