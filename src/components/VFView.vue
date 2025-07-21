<script setup lang="ts">
import { Font } from "../models";
import { computed, defineProps, ref } from 'vue';

const props = defineProps({
    families: {
        required: true,
        type: Array as () => Font[]
    }
});
const fontSize = ref(32);
const selectedFamily = ref<Font | null>(null);

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
</script>
<template>
    <div>
        <h1>Playground</h1>
        <select v-model="selectedFamily">
            <option v-for="family in props.families" :key="family.name" :value="family">
                {{ family.name }}
            </option>
        </select>
        <div v-if="selectedFamily">
            Font size:
            <input type="range" v-model="fontSize" min="8" max="100" default="32" /> {{ fontSize }}pt
            <div contenteditable="true" :style="cssStyle" style="border: 1px solid #ccc; padding: 1em;">
                Hello world
            </div>
            <div v-for="axis in selectedFamily.axes" :key="axis.tag">
                <label>{{ axis.tag }}: {{ axis.value }}</label>
                <input type="range" v-model="axis.value" :min="axis.min" :max="axis.max" />
            </div>
        </div>
    </div>
</template>