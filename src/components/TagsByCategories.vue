<script setup lang="ts">
import type { ComputedRef } from 'vue';
import { computed, ref, defineProps } from 'vue';
import { GF } from '../models';
import type { Tagging } from '../models';

const props = defineProps({
  gf: {
    type: GF,
    required: true
  },
  categories: {
    type: Array as () => string[],
    required: true
  }
});

const selectedCategories = ref<string[]>(props.categories);
const sortBy = ref('family'); // Default sorting option
const tagFilter = ref('');
const reverseTags = ref(false);

const filteredTaggings: ComputedRef<Tagging[]> = computed(() => {
  let filtered = props.gf?.allTaggings.filter(tagging =>
    selectedCategories.value.includes(tagging.tag.name)
  ) || [];
  if (sortBy.value === 'score') {
    filtered = filtered.sort((a, b) => b.score - a.score);
  }
  if (sortBy.value === 'family') {
    filtered = filtered.sort((a, b) => {
      if (a.font.name < b.font.name) return -1;
      if (a.font.name > b.font.name) return 1;
      if (a.tag.name < b.tag.name) return -1;
      if (a.tag.name > b.tag.name) return 1;
      return 0;
    });
  }
  if (sortBy.value === 'popularity' || sortBy.value === 'trending') {
    const familyData = props.gf.familyData;
    filtered = filtered.sort((a, b) => {
      const aVal = Number(familyData[a.font.name]?.[sortBy.value]) || 0;
      const bVal = Number(familyData[b.font.name]?.[sortBy.value]) || 0;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

  if (tagFilter.value !== "") {
    const myRegex = new RegExp(tagFilter.value, "i");
    filtered = filtered.filter(tag => myRegex.test(tag.font.name));
  }
  if (reverseTags.value) {
    filtered.reverse();
  }
  return filtered;
});
</script>
<template>
  <div>
    <h3>Tags for categories:</h3>
    <div>
      <v-select v-model="selectedCategories" multiple :options="gf.uniqueTagNames().sort()"></v-select>
      <label for="sortBy">Sort by:</label>
      <select id="sortBy" v-model="sortBy">
        <option value="family">Family</option>
        <option value="score">Score</option>
        <option value="popularity">Popularity</option>
        <option value="trending">Trending</option>
      </select>
      <button @click="reverseTags = !reverseTags">
        Reverse Order
      </button>
      <input type="text" v-model="tagFilter" placeholder="Filter tags by name" />
    </div>
    <div v-for="tagging in filteredTaggings" :key="tagging.font.name + tagging.tag.name + tagging.score">
      <tag-view :tagging="tagging"></tag-view>
    </div>
  </div>
</template>