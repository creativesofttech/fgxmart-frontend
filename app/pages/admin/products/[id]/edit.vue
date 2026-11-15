<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Edit Product: {{ formData.name }}</h1>
      <div class="header-actions">
        <NuxtLink to="/admin/products" class="btn-secondary tw:btn tw:btn-sm tw:btn-outline">Cancel</NuxtLink>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? 'Updating...' : 'Update Product' }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading product data...</p>
    </div>
    <div v-else class="product-grid">
      <!-- Left Column: Basic Info -->
      <div class="grid-main">
        <!-- (Same structure as create.vue) -->
        <div class="tw:card content-card">
          <div class="card-header"><h2 class="card-title">General Information</h2></div>
          <div class="card-body">
            <div class="form-group">
              <label>Product Name <span class="required">*</span></label>
              <input v-model="formData.name" type="text" class="form-input tw:input">
            </div>
            <div class="row">
              <div class="form-group col">
                <label>SKU</label>
                <input v-model="formData.sku" type="text" class="form-input tw:input">
              </div>
              <div class="form-group col">
                <label>Weight / Volume (for SKU)</label>
                <input v-model="formData.variation_code" type="text" class="form-input tw:input">
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
              <textarea v-model="formData.summary" class="form-input tw:textarea" rows="3"></textarea>
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
                  v-html="formData.description"
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
            <input ref="galleryInput" type="file" multiple accept="image/*" class="hidden tw:file-input" @change="handleGalleryUpload">

            <div v-if="gallery.length === 0" class="upload-placeholder" @click="triggerGalleryUpload">
              <Upload class="upload-icon" />
              <p>Click to upload images</p>
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
      <!-- Right Column -->
      <div class="grid-side">
        <div class="tw:card content-card">
          <div class="card-header"><h2 class="card-title">Pricing & Inventory</h2></div>
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
            <div v-else class="variations-table">
               <div class="v-table-header">
                 <span>Value</span>
                 <span>Price +/-</span>
                 <span>Stock</span>
                 <span>Action</span>
               </div>
               <div v-for="(item, index) in productAttributes" :key="index" class="v-table-row" @click="editVariation(index)">
                  <div class="v-cell value">
                    <span v-if="getAttributeValueName(item.attribute_value_id)">
                       {{ getAttributeValueName(item.attribute_value_id) }}
                    </span>
                    <span v-else class="text-gray-500">Select...</span>
                  </div>
                  <div class="v-cell price">
                    {{ item.price_adjustment > 0 ? '+' : '' }}{{ item.price_adjustment }}
                  </div>
                  <div class="v-cell stock">
                    {{ item.stock }}
                  </div>
                  <div class="v-cell actions">
                    <button class="icon-btn delete tw:btn tw:btn-sm tw:btn-ghost" @click.stop="removeVariation(index)">
                      <Trash2 class="icon" />
                    </button>
                  </div>
               </div>
            </div>
            <!-- Edit Modal / Form Area (shown when editing or adding) -->
            <div v-if="editingVariation" class="variation-editor-overlay">
               <div class="variation-editor">
                  <h3>{{ editingVariationIndex === -1 ? 'Add Variation' : 'Edit Variation' }}</h3>

                  <div class="form-group">
                    <label>Attribute Value</label>
                    <select v-model="editingVariation.attribute_value_id" class="form-input tw:select">
                      <option :value="null">Select Value</option>
                      <optgroup v-for="attr in attributes" :key="attr.id" :label="attr.name">
                        <option v-for="val in attr.values" :key="val.id" :value="val.id">
                          {{ val.value }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div class="row small-gap">
                    <div class="form-group col">
                      <label>Price Adjustment (+/-)</label>
                      <input v-model="editingVariation.price_adjustment" type="number" step="0.01" class="form-input tw:input">
                    </div>
                    <div class="form-group col">
                       <label>Stock</label>
                       <input v-model="editingVariation.stock" type="number" class="form-input tw:input">
                    </div>
                  </div>
                  <div class="form-group">
                      <label>SKU (Optional)</label>
                      <input v-model="editingVariation.sku" type="text" class="form-input tw:input">
                  </div>
                  <div class="editor-actions">
                    <button class="btn-secondary small tw:btn tw:btn-sm tw:btn-outline" @click="cancelEditVariation">Cancel</button>
                    <button class="btn-primary small tw:btn tw:btn-sm tw:btn-primary" @click="saveVariation">Save</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div class="tw:card content-card">
          <div class="card-header"><h2 class="card-title">Availability</h2></div>
          <div class="card-body">
            <div class="form-group">
              <label>Shipping Countries</label>
              <div class="multi-select-box">
                <div v-for="country in countries" :key="country.id" class="checkbox-item">
                  <label class="checkbox-container">
                    <input class="tw:checkbox tw:checkbox-primary" type="checkbox" :value="country.id" v-model="formData.countries">
                    <span class="checkmark"></span>
                    <span class="label-text">{{ country.name }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="switch-container">
              <span class="switch-label">Product Status (Active)</span>
              <label class="switch">
                <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status">
                <span class="slider round"></span>
              </label>
            </div>
            <div class="switch-container">
              <span class="switch-label">Featured</span>
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
const { success, error: toastError } = useAdminToast()
const router = useRouter()
const route = useRoute()
const saving = ref(false)
const loading = ref(true)
const categories = ref([])
const brands = ref([])
const countries = ref([])
const attributes = ref([])
const productAttributes = ref([])
const editingVariation = ref(null) // Holds the temp object being edited
const editingVariationIndex = ref(-1) // -1 for adding new, >=0 for editing
const descriptionBox = ref(null)
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
// SKU Auto-generation logic (manual/optional for edit)
watch([() => formData.category_id, () => formData.name, () => formData.variation_code], async ([catId, name, variation]) => {
  // Only auto-generate if SKU is blank or user wants to re-generate (could add a button)
  // For now, we only auto-generate if it's currently empty to avoid overwriting existing SKUs accidentally
  if (!formData.sku && catId && name && name.length >= 3) {
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
// Gallery stores both existing (with ID) and new (with File) images
const gallery = ref([])
const galleryInput = ref(null)
const removedMediaIds = ref([])
const fetchData = async () => {
  loading.value = true
  try {
    const [cats, brnds, counts, attrs, prod] = await Promise.all([
      useAdminApi('/categories?all=1'),
      useAdminApi('/brands?all=1'),
      useAdminApi('/countries?all=1'),
      useAdminApi('/attributes?all=1'),
      useAdminApi(`/products/${route.params.id}`)
    ])
    if (cats.data.value) categories.value = cats.data.value.data
    if (brnds.data.value) brands.value = brnds.data.value.data
    if (counts.data.value) countries.value = counts.data.value.data
    if (attrs.data.value) attributes.value = attrs.data.value.data

    if (prod.data.value) {
      const p = prod.data.value.data
      Object.assign(formData, {
        name: p.name,
        category_id: p.category_id,
        brand_id: p.brand_id,
        sku: p.sku,
        variation_code: p.variation_code || '',
        summary: p.summary,
        description: p.description,
        base_price: p.base_price,
        discount_price: p.discount_price,
        stock_quantity: p.stock_quantity,
        status: !!p.status,
        is_featured: !!p.is_featured,
        countries: p.countries ? p.countries.map(c => c.id) : []
      })
      // Load attributes / variations
      if (p.attribute_values) {
        productAttributes.value = p.attribute_values.map(av => ({
          attribute_value_id: av.id,
          price_adjustment: av.pivot.price_adjustment,
          price: av.pivot.price,
          stock: av.pivot.stock,
          sku: av.pivot.sku
        }))
      }
      // Load existing gallery
      gallery.value = p.media.map(m => ({
        id: m.id,
        preview: m.file_url,
        isCover: p.cover_image === m.file_path, // Rough check, better if backend says which is cover
        isExisting: true
      }))

      // If none marked as cover by file path check, and p.cover_image exists but not in media
      if (p.cover_image && !gallery.value.some(img => img.isCover)) {
          // This product has a cover image not in the gallery table
          // We can add it to the start if we want, or just handle it separately
          // For simplicity, let's assume all images are in media gallery
      }
    }
  } catch (err) {
    toastError('Failed to load product data')
  } finally {
    loading.value = false
  }
}
const getAttributeValueName = (id) => {
  if (!id) return ''
  for (const attr of attributes.value) {
    const val = attr.values.find(v => v.id == id)
    if (val) return `${attr.name}: ${val.value}`
  }
  return ''
}
const addVariation = () => {
  editingVariationIndex.value = -1
  editingVariation.value = {
    attribute_value_id: null,
    price_adjustment: 0,
    stock: 0,
    sku: ''
  }
}
const editVariation = (index) => {
  editingVariationIndex.value = index
  editingVariation.value = { ...productAttributes.value[index] } // Deep copy
}
const saveVariation = () => {
    if (!editingVariation.value.attribute_value_id) {
        toastError('Please select a variation value')
        return
    }
    if (editingVariationIndex.value === -1) {
        // Add new
        productAttributes.value.push({ ...editingVariation.value })
    } else {
        // Update existing
        productAttributes.value[editingVariationIndex.value] = { ...editingVariation.value }
    }

    // Close modal
    editingVariation.value = null
    editingVariationIndex.value = -1
}
const cancelEditVariation = () => {
    editingVariation.value = null
    editingVariationIndex.value = -1
}

const removeVariation = (index) => {
  if (confirm('Are you sure you want to remove this variation?')) {
    productAttributes.value.splice(index, 1)
  }
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
      isCover: gallery.value.length === 0,
      isExisting: false
    })
  })
}
const removeGalleryImage = (index) => {
  const img = gallery.value[index]
  if (img.isExisting) {
    removedMediaIds.value.push(img.id)
  }
  gallery.value.splice(index, 1)
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
const execCommand = (command) => { document.execCommand(command, false, null) }
const updateDescription = () => { formData.description = descriptionBox.value.innerHTML }
const handleSave = async () => {
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('name', formData.name)
    fd.append('category_id', formData.category_id || '')
    fd.append('brand_id', formData.brand_id || '')
    fd.append('sku', formData.sku || '')
    fd.append('variation_code', formData.variation_code || '')
    fd.append('summary', formData.summary || '')
    fd.append('description', formData.description || '')
    fd.append('base_price', formData.base_price)
    fd.append('discount_price', formData.discount_price || '')
    fd.append('stock_quantity', formData.stock_quantity)
    fd.append('status', formData.status ? '1' : '0')
    fd.append('is_featured', formData.is_featured ? '1' : '0')
    formData.countries.forEach(id => fd.append('countries[]', id))
    const coverIdx = gallery.value.findIndex(img => img.isCover)
    if (coverIdx !== -1 && !gallery.value[coverIdx].isExisting) {
      fd.append('cover_image', gallery.value[coverIdx].file)
    }
    // Pass meta for existing images (sorting/deletion)
    const galleryMeta = gallery.value
      .filter(img => img.isExisting)
      .map((img, index) => ({
        id: img.id,
        order: (index + 1) * 10,
        delete: false
      }))

    removedMediaIds.value.forEach(id => {
        galleryMeta.push({ id, delete: true })
    })
    fd.append('gallery_meta', JSON.stringify(galleryMeta))
    // New images
    gallery.value
      .filter(img => !img.isExisting)
      .forEach(img => fd.append('gallery[]', img.file))
    // Append Variations/Attributes
    productAttributes.value.forEach((attr, index) => {
      if (attr.attribute_value_id) {
        fd.append(`attributes[${index}][attribute_value_id]`, attr.attribute_value_id)
        fd.append(`attributes[${index}][price_adjustment]`, attr.price_adjustment || 0)
        fd.append(`attributes[${index}][stock]`, attr.stock || 0)
        if (attr.sku) fd.append(`attributes[${index}][sku]`, attr.sku)
      }
    })
    const { error: apiErr } = await useAdminApi(`/products/${route.params.id}`, {
      method: 'POST',
      body: fd
    })
    if (apiErr.value) {
      toastError(apiErr.value.data?.message || 'Update failed')
      return
    }
    success('Product updated successfully')
    router.push('/admin/products')
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    saving.value = false
  }
}
onMounted(() => {
  fetchData()
})
</script>
<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  color: #80718d;
}
.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
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

.variations-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.v-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 40px;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.v-table-header span.text-right {
  text-align: right;
}

.v-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 40px;
  gap: 0.5rem;
  align-items: center;
  transition: all 0.2s;
}
.v-table-row:hover {
}
.v-table-row .v-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.v-table-row .v-cell.value {
}
.v-table-row .v-cell.text-right {
  text-align: right;
}
.v-table-row .v-cell.actions {
  display: flex;
  justify-content: flex-end;
}

.variation-editor-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.variation-editor {
  background-color: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.variation-editor h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-base-content);
}
.variation-editor .editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.variation-editor .editor-actions button.small {
}

.small-gap {
  gap: 0.5rem;
}

.small-label {
  font-size: 0.75rem !important;
  margin-bottom: 0.25rem !important;
}
</style>
