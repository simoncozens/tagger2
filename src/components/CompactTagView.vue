<script setup lang="ts">
import { defineProps, onBeforeMount } from 'vue';
import { Tagging } from '../models';
import { EventBus } from '@/eventbus';

const props = defineProps({
    tag: Tagging,
});

onBeforeMount(() => {
    EventBus.$emit('ensure-loaded', props.tag?.family.name);
});
</script>


<template>
    <div class="compact-tag-view">
        <div class="tag-title">
            <span class="tag-score" v-if="props.tag">
                {{ props.tag.score }}
            </span>
            <span class="tag-family">{{ props.tag?.family.name }}</span>
        </div>
        <div class="text" contenteditable="true" :style="props.tag?.cssStyle(18)">
            Hello world
        </div>
    </div>
</template>