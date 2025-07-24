<script setup lang="ts">
import { Tags, Font, FontTagGroup, GF } from "../models";
import { defineProps, defineEmits, onMounted } from "vue";

type FontPanel = {
  type: "font"; // Type of panel
  font: string; // Font name
};
type CategoriesPanel = {
  type: "categories"; // Type of panel
  categories: string[]; // Array of category names
  tagGroups: FontTagGroup[]; // Array of FontTagGroup objects
};
export type Panel = FontPanel | CategoriesPanel; // Union type for panel

const props = defineProps<{
  panel: Panel,
  tags: Tags,
  gf: GF,
}>();
const emit = defineEmits(["remove-panel"]);

import { delegate } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';



onMounted(() => {
  delegate('.panel', {
    target: '.tag-name svg',
    content: (r) => {
      const tagName = r.closest('.tag-name')?.textContent?.trim() || '';
      return props.gf?.tagDefinitions[tagName]?.description || `No description available for ${tagName}`;
    },
    allowHTML: true,
    placement: 'top',
    arrow: true,
    theme: 'light-border',
    maxWidth: 300
  });
});

</script>
<template>
  <div class="panel" style="border:1px solid #ccc; padding:1em; margin-bottom:1em;">
    <button @click="emit('remove-panel')" style="float:right">✕</button>
    <tags-by-font v-if="panel.type === 'font'" :tags="tags" :font="panel.font" :gf="gf"></tags-by-font>
    <tags-by-categories v-else-if="panel.type === 'categories'" :tags="tags" :categories="panel.categories"
      :tagGroups="panel.tagGroups" :gf="gf"></tags-by-categories>
  </div>
</template>