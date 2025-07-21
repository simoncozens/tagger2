<script setup lang="ts">
import { defineProps } from 'vue';
import { FontTag } from '../models';

const props = defineProps({
    tag: FontTag
});
</script>

<template>
    <div class="tag-view">
        <div class="tag-title">
            <span class="tag-name">{{ props.tag?.tagName }}</span>
            <span class="tag-family">{{ props.tag?.family.name }}</span>
            <span class="tag-score">Score: {{ props.tag?.score }}</span>
        </div>
        <div class="text-editor" contenteditable="true" :style="props.tag?.cssStyle">
            Hello world
        </div>
    </div>
</template>