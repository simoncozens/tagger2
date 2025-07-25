<script setup lang="ts">
import { EventBus } from '@/eventbus';
import { GF } from '@/models';
import type { Tagging } from '@/models';
import { computed, defineProps, onBeforeMount, onBeforeUpdate, ref } from 'vue';

const props = defineProps({
  font: {
    type: String,
    required: true
  },
  gf: {
    type: GF,
    required: true
  }
});


const fontSize = ref(32);

// Props just gets us started, Vue gets mad at us if we change it during the
// select box. So make our own copy and use that everywhere.
const font = ref(props.font);

const selectedFamily = computed(() => {
  const familyName = font.value;
  console.log("Selected family for font:", familyName);
  return props.gf.family(familyName);
});

const location = computed(() => {
  return selectedFamily.value?.axes.reduce((acc, axis) => {
    if (axis.value) {
      // @ts-ignore // It's typed to be a number, but Vue stuffs it in as a string
      acc[axis.tag] = parseFloat(axis.value);
    }
    return acc;
  }, {} as Record<string, number>);
});


const cssStyle = computed(() => {
  if (!selectedFamily.value) return '';
  let res = `font-family: '${selectedFamily.value.name}'; font-size: ${fontSize.value}pt;`;
  if (selectedFamily.value.isVF) {
    res += ' font-variation-settings:';
  }
  selectedFamily.value.axes.forEach(axis => {
    res += ` '${axis.tag}' ${axis.value},`;
  });
  return res.slice(0, -1) + ';'; // Remove trailing comma and add semicolon
});


const similarFamilies = computed(() => {
  return props.gf.similarFamilies(font.value, 10) || [];
});

const lintErrors = computed(() => {
  if (!selectedFamily.value) return [];
  return props.gf.linter(props.gf.lintRules, selectedFamily.value) || [];
});

function removeTagging(tag: Tagging) {
  tag.font.removeTagging(tag);
}
function addFontPanel(font: string) {
  console.log("Emitting add-font-panel from TagsByFont for ", font);
  EventBus.$emit('add-font-panel', font);
}

onBeforeMount(() => {
  // Ensure the font is included in the CSS
  EventBus.$emit('ensure-loaded', font.value);
  similarFamilies.value.forEach(family => {
    props.gf?.ensureLoaded(family);
  });
});

onBeforeUpdate(() => {
  // Ensure the font is included in the CSS
  EventBus.$emit('ensure-loaded', font.value);
  similarFamilies.value.forEach(family => {
    props.gf?.ensureLoaded(family);
  });
});

</script>
<template>
  <div>
    <h3>Tags for:</h3>
    <v-select v-model="font" :options="props.gf.families.map(f => f.name)"></v-select>
    <div>
      <label>Font size:</label>
      <input type="range" v-model="fontSize" min="8" max="100" default="32" /> {{ fontSize }}pt
    </div>
    <div contenteditable="true" :style="cssStyle" style="border: 1px solid #ccc; padding: 1em;">
      Grumpy wizards make toxic brew for the evil Queen and Jack.
    </div>
    <div v-for="axis in selectedFamily?.axes" :key="axis.tag">
      <label>{{ axis.tag }}: {{ axis.value }}</label>
      <input type="range" v-model="axis.value" :min="axis.min" :max="axis.max" />
    </div>
    <ul>
      <li v-for="tagging in selectedFamily?.taggings" :key="tagging.tag.name + selectedFamily?.name">
        <span class="tag-name">{{ tagging.tag.name }}
          <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -1000 960 960" width="24px" fill="#000000">
            <path
              d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
          </svg>
        </span>
        <span v-if="'scores' in tagging" class="variable-tag tag-score">
          Variable tag
          <input type="number" v-if="location && tagging.scoreAt(location)" :value="tagging.scoreAt(location)" />
          <span class="undefined" v-if="location && !tagging.scoreAt(location)">not defined at this location</span>
        </span>
        <input type="number" v-model="tagging.score" v-if="!('scores' in tagging)"
          @change="EventBus.$emit('update:tags', selectedFamily?.taggings)" />
        <button @click="removeTagging(tagging)">Remove</button>
      </li>
    </ul>
    <h3 v-if="similarFamilies.length">Similar families</h3>
    <ul :key="similarFamilies.join('-')">
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