<template>
  <div class="product-rich-editor" data-theme="fgx">
    <div class="rich-toolbar" role="toolbar" :aria-label="`${label} formatting`">
      <AppSelect :model-value="blockType" :options="blockOptions" aria-label="Text block" :allow-empty="false" :searchable="false" :disabled="!editor" @change="setBlock" />
      <AppSelect :model-value="fontSize" :options="sizeOptions" aria-label="Font size" :allow-empty="false" :searchable="false" :disabled="!editor" @change="setSize" />
      <span class="toolbar-divider" aria-hidden="true" />
      <button v-for="tool in tools" :key="tool.name" type="button" class="tw:btn tw:btn-sm tw:btn-ghost format-button" :class="{ 'format-active': activeTools.includes(tool.name) }" :aria-label="tool.label" :title="tool.label" :aria-pressed="activeTools.includes(tool.name)" :disabled="!editor" @mousedown.prevent @click="run(tool.command)"><component :is="tool.icon" :size="17" /></button>
      <span class="toolbar-divider" aria-hidden="true" />
      <button type="button" class="tw:btn tw:btn-sm tw:btn-ghost format-button" aria-label="Undo" title="Undo" :disabled="!canUndo" @mousedown.prevent @click="run('undo')"><Undo2 :size="17" /></button>
      <button type="button" class="tw:btn tw:btn-sm tw:btn-ghost format-button" aria-label="Redo" title="Redo" :disabled="!canRedo" @mousedown.prevent @click="run('redo')"><Redo2 :size="17" /></button>
    </div>
    <EditorContent :editor="editor" class="rich-content" />
    <p class="rich-hint">Block type and font size apply only to the current paragraph or heading.</p>
  </div>
</template>

<script setup>
import { Editor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from 'lucide-vue-next'

const props = defineProps({ modelValue: { type: String, default: '' }, label: { type: String, default: 'Description' } })
const emit = defineEmits(['update:modelValue'])
const editor = shallowRef(null)
const blockType = ref('paragraph'), fontSize = ref('16px'), activeTools = ref([]), canUndo = ref(false), canRedo = ref(false)
const blockOptions = [{ id: 'paragraph', name: 'P — Paragraph' }, { id: 'h2', name: 'H2 — Heading' }, { id: 'h3', name: 'H3 — Heading' }]
const sizes = ['14px', '16px', '17px', '18px', '19px', '20px', '21px', '22px']
const sizeOptions = sizes.map(id => ({ id, name: id }))
const tools = [
  { name: 'bold', label: 'Bold', command: 'toggleBold', icon: Bold },
  { name: 'italic', label: 'Italic', command: 'toggleItalic', icon: Italic },
  { name: 'bulletList', label: 'Bullet list', command: 'toggleBulletList', icon: List },
  { name: 'orderedList', label: 'Numbered list', command: 'toggleOrderedList', icon: ListOrdered },
]
const BlockSize = Extension.create({
  name: 'blockFontSize',
  addGlobalAttributes() {
    return [{ types: ['paragraph', 'heading'], attributes: { fontSize: {
      default: null,
      parseHTML: element => sizes.includes(element.style.fontSize) ? element.style.fontSize : null,
      renderHTML: attributes => sizes.includes(attributes.fontSize) ? { style: `font-size: ${attributes.fontSize}` } : {},
    } } }]
  },
})
// Resolve just the cursor/selection-start block, even when a selection spans blocks.
const currentBlock = () => {
  const position = editor.value?.state.selection.$from
  if (!position) return null
  for (let depth = position.depth; depth > 0; depth--) {
    const node = position.node(depth)
    if (['paragraph', 'heading'].includes(node.type.name)) return { node, pos: position.before(depth) }
  }
  return null
}
const syncToolbar = () => {
  const block = currentBlock()
  blockType.value = block?.node.type.name === 'heading' ? `h${block.node.attrs.level}` : 'paragraph'
  fontSize.value = block?.node.attrs.fontSize || (blockType.value === 'h2' ? '22px' : blockType.value === 'h3' ? '20px' : '16px')
  activeTools.value = tools.filter(tool => editor.value?.isActive(tool.name)).map(tool => tool.name)
  canUndo.value = editor.value?.can().undo() || false
  canRedo.value = editor.value?.can().redo() || false
}
const updateBlock = (type, attrs) => {
  const block = currentBlock()
  if (!block) return
  const transaction = editor.value.state.tr.setNodeMarkup(block.pos, type, attrs, block.node.marks)
  editor.value.view.dispatch(transaction)
  editor.value.commands.focus()
}
const setBlock = value => {
  if (!['paragraph', 'h2', 'h3'].includes(value)) return
  const block = currentBlock()
  if (!block) return
  const type = value === 'paragraph' ? editor.value.schema.nodes.paragraph : editor.value.schema.nodes.heading
  updateBlock(type, { fontSize: block.node.attrs.fontSize, ...(value !== 'paragraph' ? { level: Number(value.slice(1)) } : {}) })
}
const setSize = value => {
  if (!sizes.includes(value)) return
  const block = currentBlock()
  if (block) updateBlock(block.node.type, { ...block.node.attrs, fontSize: value })
}
const run = command => editor.value?.chain().focus()[command]().run()
onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, blockquote: false, horizontalRule: false }), BlockSize],
    content: props.modelValue,
    editorProps: { attributes: { role: 'textbox', 'aria-label': props.label, 'aria-multiline': 'true', class: 'product-description-document' } },
    onUpdate: ({ editor: instance }) => emit('update:modelValue', instance.isEmpty ? '' : instance.getHTML()),
    onTransaction: syncToolbar,
  })
  syncToolbar()
})
watch(() => props.modelValue, value => {
  if (editor.value && value !== editor.value.getHTML() && !(editor.value.isEmpty && !value)) editor.value.commands.setContent(value || '', { emitUpdate: false })
})
onBeforeUnmount(() => editor.value?.destroy())
</script>

<style scoped>
.product-rich-editor { border: 1px solid #dfd5eb; border-radius: 12px; background: #fff; color: #2e2044; min-width: 0; }
.product-rich-editor:focus-within { border-color: #ac8bcc; }
.rich-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 10px; background: #f8f5fc; border-radius: 12px 12px 0 0; border-bottom: 1px solid #e9e0f2; }
.rich-toolbar .app-select { width: 155px; }
.rich-toolbar .app-select:nth-child(2) { width: 95px; }
.toolbar-divider { width: 1px; height: 23px; margin: 0 4px; background: #e0d6ec; }
.format-button { width: 34px; min-width: 34px; padding: 0; color: #68527f; }
.format-button.format-active { background: #e8dcf6; color: #513283; }
.rich-content :deep(.tiptap) { min-height: 235px; padding: 18px; outline: none; font-size: 16px; line-height: 1.65; overflow-wrap: anywhere; }
.rich-content :deep(p) { margin: 0 0 12px; font-size: 16px; }
.rich-content :deep(h2) { margin: 18px 0 12px; font-size: 22px; line-height: 1.35; font-weight: 700; }
.rich-content :deep(h3) { margin: 16px 0 10px; font-size: 20px; line-height: 1.4; font-weight: 650; }
.rich-content :deep(ul), .rich-content :deep(ol) { padding-left: 25px; margin: 12px 0; }
.rich-content :deep(ul) { list-style-type: disc; }
.rich-content :deep(ol) { list-style-type: decimal; }
.rich-content :deep(li p) { margin-bottom: 5px; }
.rich-content :deep(.tiptap > :first-child) { margin-top: 0; }
.rich-content :deep(.tiptap > :last-child) { margin-bottom: 0; }
.rich-hint { margin: 0; padding: 9px 16px; color: #8b7a9b; font-size: 11px; border-top: 1px solid #f0eaf6; }
@media(max-width:600px) { .rich-toolbar { padding: 8px; } .rich-content :deep(.tiptap) { padding: 14px; } }
</style>
