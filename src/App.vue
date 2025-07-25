<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import type { ComputedRef } from 'vue';
import { GF, Tags, FontTag, FontTagGroup } from './models';
import type { Panel } from './components/Panel.vue';
import type { FilterSet } from './components/AddTags.vue';
import { EventBus } from './eventbus';

let appLoaded = ref(false);
let gf = ref<GF | null>(null);
window.gf = gf;
let tags = ref<Tags | null>(null);
let tagGroups = ref<FontTagGroup[]>([]);
let panels = ref<Panel[]>([
  { type: 'font', font: 'Roboto' },
  { type: 'categories', categories: ['/Expressive/Loud', '/Expressive/Childlike'], tagGroups: [] }
]);

function performAddTag(tag: FontTag) {
  if (!tags.value) return;
  console.log("Adding tag", tag);
  const family = gf.value?.families.find(f => f.name === tag.family.name);
  if (family) {
    tag.family = family; // Ensure the family is set correctly
    tags.value.items.push(tag);
  }
}

function performAddTags(filterSet: FilterSet) {
  console.log("Filter set", filterSet);
  for (let family of gf.value?.families || []) {
    let addFamily = false;
    for (let axis of family.axes) {
      if (
        filterSet.lowTag.filters.some(f => f.axis == axis.tag) &&
        filterSet.highTag.filters.some(f => f.axis == axis.tag) &&
        filterSet.lowTag.filters.some(f => f.value >= axis.min) &&
        filterSet.highTag.filters.some(f => f.value <= axis.max)) { addFamily = true; }
    }
    if (addFamily) {
      for (let category of filterSet.categories) {
        const lowTag = new FontTag(category, family, [{ tagName: "wght", value: 100 }],
          filterSet.lowTag.score);
        const highTag = new FontTag(category, family, [{ tagName: "wght", value: 900 }],
          filterSet.highTag.score);
        const fontTag = new FontTagGroup();
        fontTag.addTag(lowTag);
        fontTag.addTag(highTag);
        tagGroups.value.push(fontTag);
      }
    }
  }
}
function performAddCategory(category: string) {
  if (!tags.value!.categories.includes(category)) {
    tags.value!.categories.push(category);
  }
}
function addFontPanel(font: string) {
  panels.value.push({ type: 'font', font });
}
function addTodoPanel() {
  panels.value.push({ type: 'todo' });
}
function addCategoriesPanel() {
  panels.value.push({
    type: 'categories', tagGroups: tagGroups.value
  });
}
function removePanel(idx: number) { panels.value.splice(idx, 1); }
function removeTag(tag: FontTag) {
  const index = tags.value!.items.indexOf(tag);
  if (index !== -1) {
    tags.value!.items.splice(index, 1);
  }
}
function updateTags(newTags: Tags) {
  tags.value = newTags;
}

onBeforeMount(async () => {
  gf.value = new GF();
  await gf.value.getFamilyData();
  await gf.value.getLintRules();
  await gf.value.getTagDefinitions();
  gf.value.loadFamilies();
  tags.value = new Tags(gf.value);
  // Subscribe to events
  const family = gf.value.families.find(f => f.name === 'Maven Pro');
  if (!family) {
    console.error("Family 'Maven Pro' not found");
  } else {
    const tag1 = new FontTag('/Purpose/Easy Reading', family, [{ tagName: "wght", value: 400 }], 10);
    const tag2 = new FontTag('/Purpose/Easy Reading', family, [{ tagName: "wght", value: 900 }], 100);
    const tagGroup = new FontTagGroup();
    tagGroup.addTag(tag1);
    tagGroup.addTag(tag2);
    tagGroups.value.push(tagGroup);
  }

  EventBus.$on('ensure-loaded', (family: string) => {
    gf.value?.ensureLoaded(family);
  });

  EventBus.$on('add-font-panel', addFontPanel);
  EventBus.$on('remove-tag', removeTag);
  EventBus.$on('update:tags', updateTags);

  appLoaded.value = true;

});


</script>


<template>
  <div id="app">
    <div id="fonts" :key="gf?.loadedFamilies.length">
      <link v-for="family in gf?.loadedFamilies" :href="family.url" rel="stylesheet">
    </div>
    <div id="content" v-if="appLoaded">
      <button @click="addFontPanel('Maven Pro')">Tags in font</button>
      <button @click="addCategoriesPanel(['/Expressive/Loud'])">Tags in category</button>
      <button @click="addTodoPanel()">Todo List</button>
      <add-tag :categories="categories" @tag-added="performAddTag"></add-tag>
      <add-tags :categories="categories" @tags-added="performAddTags"></add-tags>
      <div style="display: flex; flex-direction: row; width: 100vw; min-height: 100vh;">
        <div v-for="(panel, idx) in panels" :key="idx"
          :style="{ flex: '1 1 0', minWidth: 0, borderRight: idx < panels.length - 1 ? '1px solid #eee' : 'none', height: '100vh', overflow: 'auto' }">
          <panel :panel="panel" :gf="gf" :tags="tags" @remove-panel="removePanel(idx)">
          </panel>
        </div>
      </div>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>
