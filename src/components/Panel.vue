<script lang="ts">// No setup magic for exports
type FontPanel = {
  type: "font"; // Type of panel
  font: string; // Font name
};
type CategoriesPanel = {
  type: "categories"; // Type of panel
  categories: string[]; // Array of category names
  // tagGroups: FontTagGroup[]; // Array of FontTagGroup objects
};
type TodoPanel = {
  type: "todo"; // Type of panel
};
export type Panel = FontPanel | CategoriesPanel | TodoPanel; // Union type for panel
</script>

<script setup lang="ts">
import type { GF } from "../models";
import { defineProps, defineEmits, onMounted } from "vue";
import { delegate } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/material.css';

const props = defineProps<{
  panel: Panel,
  gf: GF,
}>();
const emit = defineEmits(["remove-panel", "shift-left", "shift-right"]);



onMounted(() => {
  delegate('.panel', {
    target: '.tag-name svg',
    content: (r) => {
      const tagName = r.closest('.tag-name')?.textContent?.trim() || '';
      return props.gf?.tags[tagName]?.description || `No description available for ${tagName}`;
    },
    allowHTML: true,
    placement: 'top',
    arrow: true,
    theme: 'material',
    maxWidth: 300
  });
});

</script>
<template>
  <div class="panel" style="border:1px solid #ccc; padding:1em; margin-bottom:1em;">
    <button @click="emit('remove-panel')" style="float:right">✕</button>
    <button @click="emit('shift-left')" style="float:right">←</button>
    <button @click="emit('shift-right')" style="float:right">→</button>
    <tags-by-font v-if="panel.type === 'font'" :font="panel.font" :gf="gf"></tags-by-font>
    <tags-by-categories v-else-if="panel.type === 'categories'" :categories="panel.categories"
      :gf="gf"></tags-by-categories>
    <todo v-else-if="panel.type === 'todo'" :gf="gf"></todo>
  </div>
</template>