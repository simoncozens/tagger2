<script setup lang="ts">
import { FontTag, GF } from '@/models';
import { computed, defineProps, getCurrentInstance, ref } from 'vue';

const props = defineProps({
  tags: {
    type: Array as () => FontTag[],
    required: true
  },
  font: {
    type: String,
    required: true
  },
  gf: {
    type: GF,
    required: true
  }
});
const emit = defineEmits(['remove-tag', 'add-font-panel', 'update:tags']);

const font = ref(props.font); // Input for new category


const filteredTags = computed(() => {
  // Assumes each tag has a property 'family' with a 'name'
  return props.tags.filter(tag => tag.family && tag.family.name === font.value);
});

const similarFamilies = computed(() => {
  return props.gf.similarFamilies(font.value, 10) || [];
});

const lintErrors = computed(() => {
  return props.gf.linter(props.gf.lintRules, font.value, filteredTags.value) || [];
});

// These are emitted to the panel component; remember to handle them there
function removeTag(tag: FontTag) {
  emit('remove-tag', tag);
}
function addFontPanel(font: string) {
  console.log("Emitting add-font-panel from TagsByFont for ", font);
  emit('add-font-panel', font);
}
</script>
<template>
  <div>
    <h3>Tags for:</h3>
    <select v-model="font">
      <option
        v-for="tag in tags.map(tag => tag.family.name).filter((value, index, self) => self.indexOf(value) === index)"
        :key="tag">
        {{ tag }}
      </option>
    </select>
    <p :style="{ fontFamily: font }" contenteditable="true" class="sample">
      Grumpy wizards make toxic brew for the evil Queen and Jack.
    </p>

    <ul>
      <li v-for="tag in filteredTags" :key="tag.tagName + tag.family.name + tag.score">
        <span class="tag-name">{{ tag.tagName }}
          <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -1000 960 960" width="24px" fill="#000000"
            v-if="props.gf?.tagDefinitions[tag.tagName]">
            <path
              d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
          </svg>
        </span>
        <input type="number" v-model="tag.score" @change="emit('update:tags', tags)" />
        <button @click="removeTag(tag)">Remove</button>
      </li>
    </ul>
    <h3 v-if="similarFamilies.length">Similar families</h3>
    <ul>
      <li v-for="family in similarFamilies" :key="family" :style="{ fontFamily: family }">
        {{ family }} <button @click="addFontPanel(family)">Add</button>
      </li>
    </ul>
    <h3 v-if="lintErrors.length">Warnings</h3>
    <ul>
      <li v-for="error in lintErrors" :key="error.description"
        :class="{ 'tag-error': error.severity === 'ERROR', 'tag-warn': error.severity === 'WARN', 'tag-fail': error.severity === 'FAIL', 'tag-info': error.severity === 'INFO' }">
        {{ error.description }}
      </li>
    </ul>
  </div>
</template>