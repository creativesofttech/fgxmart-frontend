<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="title">Edit Web Page</h1>
      <div class="header-actions">
        <NuxtLink to="/admin/pages" class="btn-secondary tw:btn tw:btn-sm tw:btn-outline">Cancel</NuxtLink>
        <button class="btn-primary tw:btn tw:btn-sm tw:btn-primary" @click="savePage" :disabled="saving || loading">
          {{ saving ? 'Saving...' : 'Update Page' }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading page data...</p>
    </div>
    <div v-else class="page-builder-grid">
      <!-- Sidebar: Settings -->
      <div class="builder-sidebar">
        <div class="tw:card content-card">
          <div class="card-tabs">
            <button
              v-for="tab in ['General', 'SEO']"
              :key="tab"
              class="tab-btn tw:btn tw:btn-sm tw:btn-ghost"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <div class="card-body">
            <!-- General Settings -->
            <div v-show="activeTab === 'General'" class="form-section">
              <div class="form-group">
                <label>Page Title <span class="required">*</span></label>
                <input v-model="formData.title" type="text" class="form-input tw:input" placeholder="Ex: About Us">
              </div>
              <div class="form-group">
                <label>Slug (URL)</label>
                <input v-model="formData.slug" type="text" class="form-input tw:input" placeholder="about-us">
              </div>
              <div class="form-group">
                <label>Menu Position</label>
                <select v-model="formData.position" class="form-input tw:select">
                  <option value="none">Nowhere (Hidden)</option>
                  <option value="header">Header Menu</option>
                  <option value="footer">Footer Menu</option>
                  <option value="both">Both Menus</option>
                </select>
              </div>
              <div class="switch-container">
                <span class="switch-label">Published Status</span>
                <label class="switch">
                  <input class="tw:checkbox tw:checkbox-primary" type="checkbox" v-model="formData.status" :id="'page-status-' + pageId">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
            <!-- SEO Settings -->
            <div v-show="activeTab === 'SEO'" class="form-section">
              <div class="form-group">
                <label>Meta Title</label>
                <input v-model="formData.meta_title" type="text" class="form-input tw:input" placeholder="SEO Title">
              </div>
              <div class="form-group">
                <label>Meta Description</label>
                <textarea v-model="formData.meta_description" rows="5" class="form-input tw:textarea" placeholder="SEO Description"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Main Content: Block Builder -->
      <div class="builder-main">
        <div class="tw:card content-card">
          <div class="card-header">
            <h2 class="card-title">Page Content Builder</h2>
            <button class="btn-text tw:btn tw:btn-sm tw:btn-ghost" @click="addBlock">
              <Plus class="icon" /> Add Section
            </button>
          </div>

          <div class="card-body builder-canvas">
            <div v-if="formData.content.length === 0" class="empty-canvas">
              <div class="empty-info">
                <Layout class="empty-icon" />
                <h3>Your page is empty</h3>
                <p>Start adding content sections to build your page.</p>
                <button class="btn-primary tw:mt-4 tw:btn tw:btn-sm tw:btn-primary" @click="addBlock">+ Add First Section</button>
              </div>
            </div>
            <div v-else class="blocks-list">
              <div v-for="(block, index) in formData.content" :key="index" class="block-card">
                <div class="block-header">
                  <div class="block-type">
                    <GripVertical class="drag-handle" />
                    <span class="index">#{{ index + 1 }}</span>
                    <select v-model="block.type" class="type-select tw:select">
                      <option value="HeroSection">Hero Section</option>
                      <option value="RichText">Rich Text Content</option>
                    </select>
                  </div>
                  <button class="btn-icon delete tw:btn tw:btn-sm tw:btn-ghost tw:btn-square" @click="removeBlock(index)">
                    <Trash2 class="icon" />
                  </button>
                </div>
                <div class="block-content">
                  <!-- Hero Section Fields -->
                  <div v-if="block.type === 'HeroSection'" class="hero-fields">
                    <div class="form-group">
                      <label>Hero Heading</label>
                      <input v-model="block.data.title" type="text" class="form-input tw:input" placeholder="Main Heading">
                    </div>
                    <div class="form-group">
                      <label>Hero Subheading</label>
                      <textarea v-model="block.data.subtitle" class="form-input tw:textarea" rows="2" placeholder="Smaller text below heading"></textarea>
                    </div>
                  </div>
                  <!-- Rich Text Editor Block -->
                  <div v-else-if="block.type === 'RichText'" class="editor-block">
                    <label class="field-label">Content Editor</label>
                    <div class="rich-editor">
                      <div class="editor-toolbar">
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Bold" @click="execEditorCommand(index, 'bold')"><Bold class="ti-icon"/></button>
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Italic" @click="execEditorCommand(index, 'italic')"><Italic class="ti-icon"/></button>
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Underline" @click="execEditorCommand(index, 'underline')"><Underline class="ti-icon"/></button>
                        <span class="divider"></span>
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Insert Image" @click="triggerImageUpload(index)" :disabled="uploading">
                          <ImageIcon class="ti-icon" v-if="!uploading || currentEditorIndex !== index" />
                          <span v-else class="tw:loading tw:loading-spinner tw:loading-xs" aria-label="Uploading" />
                        </button>
                        <span class="divider"></span>
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Bullet List" @click="execEditorCommand(index, 'insertUnorderedList')"><List class="ti-icon"/></button>
                        <button class="tw:btn tw:btn-sm tw:btn-ghost" type="button" title="Ordered List" @click="execEditorCommand(index, 'insertOrderedList')"><ListOrdered class="ti-icon"/></button>
                      </div>
                      <div
                        :ref="el => editorRefs[index] = el"
                        contenteditable="true"
                        class="editor-content"
                        @input="e => updateBlockContent(index, e.target.innerHTML)"
                        v-html="block.data.html"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Hidden File Input for Image Upload -->
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      class="hidden tw:file-input"
      @change="handleImageUpload"
    >
  </div>
</template>
<script setup>
definePageMeta({ layout: "admin" })
import { ref, reactive, onMounted } from 'vue'
import {
  Plus,
  Trash2,
  GripVertical,
  Layout,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  List,
  ListOrdered
} from 'lucide-vue-next'
import { useAdminToast } from '~/composables/useAdminToast'
const { success, error: toastError } = useAdminToast()
const router = useRouter()
const route = useRoute()
const pageId = route.params.id
const saving = ref(false)
const loading = ref(true)
const uploading = ref(false)
const activeTab = ref('General')
const editorRefs = ref({})
const imageInput = ref(null)
const currentEditorIndex = ref(null)
const formData = reactive({
  title: '',
  slug: '',
  content: [],
  position: 'none',
  status: true,
  meta_title: '',
  meta_description: ''
})
const fetchPageData = async () => {
  loading.value = true
  try {
    const data = await $adminApi(`/pages/${pageId}`)
    if (data && data.data) {
      const page = data.data
      Object.assign(formData, {
        title: page.title,
        slug: page.slug,
        content: page.content || [],
        position: page.position,
        status: !!page.status,
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || ''
      })
    }
  } catch (err) {
    toastError('Failed to load page data')
    router.push('/admin/pages')
  } finally {
    loading.value = false
  }
}
const addBlock = () => {
  formData.content.push({
    type: 'RichText',
    data: { html: '', title: '', subtitle: '' }
  })
}
const removeBlock = (index) => {
  formData.content.splice(index, 1)
}
const updateBlockContent = (index, html) => {
  formData.content[index].data.html = html
}
const execEditorCommand = (index, command) => {
  const el = editorRefs.value[index]
  if (el) {
    el.focus()
    document.execCommand(command, false, null)
  }
}
const triggerImageUpload = (index) => {
  currentEditorIndex.value = index
  imageInput.value.click()
}
const handleImageUpload = async (e) => {
  const file = e.target.files[0]
  if (!file || currentEditorIndex.value === null) return
  const index = currentEditorIndex.value
  const fd = new FormData()
  fd.append('image', file)
  uploading.value = true
  try {
    const { data: res, error: apiErr } = await useAdminApi('/media/upload', {
      method: 'POST',
      body: fd
    })
    if (apiErr.value) {
      toastError(apiErr.value.data?.message || 'Failed to upload image')
      return
    }
    if (res.value && res.value.url) {
      const imgHtml = `<img src="${res.value.url}" alt="image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`
      const el = editorRefs.value[index]
      if (el) {
        el.focus()
        document.execCommand('insertHTML', false, imgHtml)
        updateBlockContent(index, el.innerHTML)
      }
    }
  } catch (err) {
    toastError('Error uploading image')
  } finally {
    uploading.value = false
    currentEditorIndex.value = null
    e.target.value = '' // Reset input
  }
}
const savePage = async () => {
  if (!formData.title) {
    toastError('Page title is required')
    return
  }
  saving.value = true
  try {
    const { error: apiErr } = await useAdminApi(`/pages/${pageId}`, {
      method: 'PUT',
      body: formData
    })

    if (apiErr.value) {
      toastError(apiErr.value.data?.message || 'Validation error')
      return
    }

    success('Page updated successfully')
    router.push('/admin/pages')
  } catch (err) {
    toastError('An unexpected error occurred')
  } finally {
    saving.value = false
  }
}
onMounted(() => {
  fetchPageData()
})
</script>
<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 3rem;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rem 0;
}
.loading-state p {
  color: #80718d;
  margin-top: 1rem;
}
.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.page-builder-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .page-builder-grid {
    grid-template-columns: 1fr;
  }
}
.content-card {
  background-color: var(--color-base-100);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  overflow: hidden;
}

.card-tabs {
  display: flex;
  background-color: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgb(71 37 128 / 10%);
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: none;
  color: #80718d;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.tab-btn:hover {
  color: var(--color-base-content);
  background-color: rgb(71 37 128 / 10%);
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.05);
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

.empty-canvas {
  padding: 5rem 1rem;
  text-align: center;
  display: flex;
  justify-content: center;
}
.empty-canvas .empty-info {
  max-width: 300px;
}
.empty-canvas .empty-info .empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-base-300);
  margin-bottom: 1.5rem;
}
.empty-canvas .empty-info h3 {
  color: var(--color-base-content);
  margin-bottom: 0.5rem;
}
.empty-canvas .empty-info p {
  color: #64748b;
  font-size: 0.9rem;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.block-card {
  background-color: var(--color-base-200);
  border: 1px solid rgb(71 37 128 / 10%);
  border-radius: 0.75rem;
  overflow: hidden;
}
.block-card .block-header {
  background-color: rgb(71 37 128 / 10%);
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgb(71 37 128 / 10%);
}
.block-card .block-header .block-type {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.block-card .block-header .block-type .drag-handle {
  width: 18px;
  color: #4b5563;
  cursor: grab;
}
.block-card .block-header .block-type .index {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.8rem;
}
.block-card .block-header .block-type .type-select {
}
.block-card .block-header .block-type .type-select option {
}
.block-card .block-content {
  padding: 1.25rem;
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
  align-items: center;
}
.rich-editor .editor-toolbar .divider {
  width: 1px;
  height: 20px;
  background-color: rgb(71 37 128 / 10%);
  margin: 0 0.25rem;
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
  min-height: 150px;
  color: var(--color-base-content);
  font-size: 0.9375rem;
  outline: none;
}
.rich-editor .editor-content:empty:before {
  content: "Type your content here...";
  color: #475569;
  pointer-events: none;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #80718d;
  font-size: 0.8rem;
}

.btn-primary {
  text-decoration: none;
  display: inline-block;
}
.btn-primary:hover:not(:disabled) {
}
.btn-primary:disabled {
}

.btn-secondary {
  text-decoration: none;
}
.btn-secondary:hover {
}

.btn-icon.delete {
}
.btn-icon.delete:hover {
}
.btn-icon.delete .icon {
  width: 18px;
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
  width: 16px;
}

.switch-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
}

.switch-label {
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
</style>
