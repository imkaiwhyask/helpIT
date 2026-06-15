<template>
  <node-view-wrapper class="rimg-wrap" :class="{ 'rimg-selected': selected }">
    <img
      ref="imgRef"
      :src="node.attrs.src"
      :alt="node.attrs.alt || ''"
      :style="{ width: displayWidth, maxWidth: '100%' }"
      draggable="false"
      @click="selectNode"
    />
    <!-- resize handle — bottom-right corner -->
    <span v-if="selected" class="rimg-handle" @mousedown.prevent.stop="startResize" />
  </node-view-wrapper>
</template>

<script setup>
import { ref, computed } from 'vue';
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';

const props = defineProps(nodeViewProps);

const imgRef   = ref(null);
const dragging = ref(false);

const displayWidth = computed(() =>
  props.node.attrs.width ? props.node.attrs.width + 'px' : '100%'
);

function startResize(e) {
  const startX = e.clientX;
  const startW = imgRef.value.offsetWidth;
  dragging.value = true;

  function onMove(e) {
    const w = Math.max(60, startW + e.clientX - startX);
    props.updateAttributes({ width: Math.round(w) });
  }

  function onUp() {
    dragging.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}
</script>

<style scoped>
.rimg-wrap {
  display: inline-block;
  position: relative;
  line-height: 0;
  user-select: none;
}

.rimg-wrap img {
  display: block;
  border-radius: 2px;
}

.rimg-selected img {
  outline: 2px solid #002d72;
  outline-offset: 1px;
}

.rimg-handle {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: #002d72;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: se-resize;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
</style>
