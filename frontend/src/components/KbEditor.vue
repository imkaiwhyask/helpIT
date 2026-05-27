<template>
  <div class="kb-editor">
    <!-- Toolbar -->
    <div class="kb-toolbar">
      <button type="button" :class="{ active: editor?.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Bold"><b>B</b></button>
      <button type="button" :class="{ active: editor?.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italic"><i>I</i></button>
      <button type="button" :class="{ active: editor?.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="Underline"><u>U</u></button>
      <button type="button" :class="{ active: editor?.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Strikethrough"><s>S</s></button>
      <span class="sep" />
      <button type="button" :class="{ active: editor?.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="{ active: editor?.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor?.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="sep" />
      <button type="button" :class="{ active: editor?.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Bullet list">≡</button>
      <button type="button" :class="{ active: editor?.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Ordered list">1.</button>
      <button type="button" :class="{ active: editor?.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Blockquote">"</button>
      <button type="button" :class="{ active: editor?.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()" title="Code block">&lt;/&gt;</button>
      <span class="sep" />
      <button type="button" :class="{ active: editor?.isActive({ textAlign: 'left' }) }"    @click="editor.chain().focus().setTextAlign('left').run()"    title="Align left">L</button>
      <button type="button" :class="{ active: editor?.isActive({ textAlign: 'center' }) }"  @click="editor.chain().focus().setTextAlign('center').run()"  title="Align center">C</button>
      <button type="button" :class="{ active: editor?.isActive({ textAlign: 'right' }) }"   @click="editor.chain().focus().setTextAlign('right').run()"   title="Align right">R</button>
      <button type="button" :class="{ active: editor?.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()" title="Justify">J</button>
      <span class="sep" />
      <button type="button" @click="setLink" :class="{ active: editor?.isActive('link') }" title="Link">🔗</button>
      <button type="button" @click="fileRef.click()" title="Insert image">🖼</button>
      <span class="sep" />
      <button type="button" @click="editor.chain().focus().undo().run()" title="Undo">↩</button>
      <button type="button" @click="editor.chain().focus().redo().run()" title="Redo">↪</button>
    </div>

    <!-- Document area -->
    <div class="kb-doc-area">
      <EditorContent :editor="editor" class="kb-content" />
    </div>

    <!-- Hidden file input for image upload -->
    <input ref="fileRef" type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { ElMessage } from 'element-plus';
import api from '../api';
import ResizableImageView from './ResizableImageView.vue';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, renderHTML: attrs => attrs.width ? { width: attrs.width } : {} },
    };
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageView);
  },
});

const props = defineProps({ modelValue: { type: String, default: '' } });
const emit  = defineEmits(['update:modelValue']);

const fileRef = ref(null);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    ResizableImage.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: 'Start writing…' }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML());
  },
});

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', false);
  }
});

onBeforeUnmount(() => editor.value?.destroy());

function setLink() {
  const prev = editor.value.getAttributes('link').href;
  const url  = window.prompt('URL', prev || 'https://');
  if (!url) { editor.value.chain().focus().unsetLink().run(); return; }
  editor.value.chain().focus().setLink({ href: url }).run();
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  try {
    const res = await api.post('/kb/upload-image', fd);
    if (res.data.url) {
      editor.value.chain().focus().setImage({ src: res.data.url }).run();
      ElMessage.success('Image inserted');
    } else {
      ElMessage.error('Upload succeeded but no URL returned');
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || err.message || 'Image upload failed');
  } finally {
    e.target.value = '';
  }
}
</script>

<style scoped>
/* A4 at 96 dpi: 794 × 1123 px */
.kb-editor {
  border: 1px solid rgba(0,0,0,0.23);
  border-radius: 2px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.kb-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  flex-wrap: wrap;
  background: #fafafa;
  flex-shrink: 0;
}

.kb-toolbar button {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(0,0,0,0.7);
  min-width: 28px;
  line-height: 1.4;
}
.kb-toolbar button:hover  { background: rgba(0,0,0,0.08); }
.kb-toolbar button.active { background: rgba(33,150,243,0.12); color: #2196F3; font-weight: 600; }

.sep { width: 1px; height: 20px; background: rgba(0,0,0,0.15); margin: 0 4px; }

/* Gray "desk" that pages sit on */
.kb-doc-area {
  background: #fafafa;
  overflow-y: auto;
  padding: 24px 0 32px;
  flex: 1;
}

/* The white A4 paper */
.kb-content {
  width: 794px;
  margin: 0 auto;
  cursor: text;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.45);
  /* Page-break line every 1123px (A4 height) */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent calc(1123px - 2px),
    #c8c8c8 calc(1123px - 2px),
    #c8c8c8 1123px
  );
}

.kb-content :deep(.ProseMirror) {
  outline: none;
  min-height: 1123px;
  /* A4 margins: ~25 mm top/bottom, ~20 mm left/right */
  padding: 96px 90px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(0,0,0,0.87);
  word-break: break-word;
}

.kb-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: rgba(0,0,0,0.3);
  pointer-events: none;
  float: left;
  height: 0;
}

.kb-content :deep(.ProseMirror h1) { font-size: 22px; font-weight: 600; margin: 20px 0 10px; }
.kb-content :deep(.ProseMirror h2) { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
.kb-content :deep(.ProseMirror h3) { font-size: 15px; font-weight: 600; margin: 12px 0 6px; }
.kb-content :deep(.ProseMirror p)  { margin: 0 0 10px; }
.kb-content :deep(.ProseMirror ul),
.kb-content :deep(.ProseMirror ol) { padding-left: 28px; margin: 4px 0 10px; }
.kb-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid #2196F3; background: #f5f7fa;
  padding: 8px 16px; margin: 12px 0; color: rgba(0,0,0,0.54);
}
.kb-content :deep(.ProseMirror code)     { background: #f0f0f0; padding: 1px 5px; border-radius: 2px; font-size: 12px; font-family: monospace; }
.kb-content :deep(.ProseMirror pre)      { background: #1e1e1e; color: #d4d4d4; padding: 14px 16px; border-radius: 2px; overflow-x: auto; margin: 12px 0; }
.kb-content :deep(.ProseMirror pre code) { background: none; padding: 0; }
.kb-content :deep(.ProseMirror img)      { max-width: 100%; border-radius: 2px; margin: 8px 0; display: block; }
.kb-content :deep(.ProseMirror a)        { color: #2196F3; text-decoration: underline; }
.kb-content :deep(.ProseMirror hr)       { border: none; border-top: 1px solid rgba(0,0,0,0.15); margin: 16px 0; }
</style>
