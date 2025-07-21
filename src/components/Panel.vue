<script setup lang="ts">
import { Tags, Font, FontTagGroup, GF, FontTag } from "../models";
import { defineProps, defineEmits } from "vue";

type FontPanel = {
  type: "font"; // Type of panel
  font: string; // Font name
};
type CategoriesPanel = {
  type: "categories"; // Type of panel
  categories: string[]; // Array of category names
  tagGroups: FontTagGroup[]; // Array of FontTagGroup objects
};
type VfPanel = {
  type: "vf-view"; // Type of panel
  families: Font[]; // Array of font families
};
export type Panel = FontPanel | CategoriesPanel | VfPanel; // Union type for panel

const props = defineProps<{
  panel: Panel,
  tags: Tags,
  gf: GF,
}>();
const emit = defineEmits(["remove-panel", 'remove-tag', 'add-font-panel', 'update:tags']);

// Bubble emits to parent
function removeTag(tag: FontTag) {
  emit('remove-tag', tag);
}
function addFontPanel(font: string) {
  emit('add-font-panel', font);
}
function updateTags(tags: Tags) {
  emit('update:tags', tags);
}

</script>
<template>
  <div class="panel" style="border:1px solid #ccc; padding:1em; margin-bottom:1em;">
    <button @click="emit('remove-panel')" style="float:right">✕</button>
    <tags-by-font v-if="panel.type === 'font'" :tags="tags" :font="panel.font" :gf="gf" @remove-tag="removeTag"
      @add-font-panel="addFontPanel" @update:tags="updateTags"></tags-by-font>
    <tags-by-categories v-else-if="panel.type === 'categories'" :tags="tags" :categories="panel.categories"
      :tagGroups="panel.tagGroups" :gf="gf"></tags-by-categories>
    <vf-view v-else-if="panel.type === 'vf-view'" :families="panel.families" :gf="gf"></vf-view>
  </div>
</template>