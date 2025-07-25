<script setup lang="ts">
import { defineProps, onBeforeMount } from 'vue';
import type { PropType } from 'vue';
import { Font } from '../models';
import type { Location, StaticTagging } from '../models';
import { EventBus } from '@/eventbus';

const props = defineProps({
    tag: Object as PropType<StaticTagging>,
    location: Object as PropType<Location>,
});

onBeforeMount(() => {
    EventBus.$emit('ensure-loaded', props.tag?.font.name);
});
</script>


<template>
    <div class="compact-tag-view">
        <div class="tag-title">
            <span class="tag-score" v-if="props.tag">
                {{ props.tag?.score }}
            </span>
            <span class="tag-family">{{ props.tag?.font.name }}</span>
        </div>
        <div class="text" contenteditable="true" :style="props.tag?.font.cssStyle(18)">
            Hello world
        </div>
    </div>
</template>