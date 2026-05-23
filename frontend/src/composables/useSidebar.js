import { ref, computed } from 'vue';

// Module-level singletons so header + sidebar share the same state
const collapsed = ref(false);
const hovered   = ref(false);

export function useSidebar() {
  const isExpanded = computed(() => !collapsed.value || hovered.value);
  function toggle()          { collapsed.value = !collapsed.value; }
  function setHover(val)     { hovered.value = val; }
  return { isExpanded, collapsed, toggle, setHover };
}
