<script setup lang="ts">
import { defineProps, onBeforeMount } from 'vue';
import type { PropType } from 'vue';
import { Font } from '../models';
import type { Location, StaticTagging } from '../models';
import { EventBus } from '@/eventbus';

const props = defineProps({
    family: Font,
    tag: Object as PropType<StaticTagging>,
    location: Object as PropType<Location>,
});

onBeforeMount(() => {
    EventBus.$emit('ensure-loaded', props.family?.name);
});
</script>


<template>
    <div class="compact-tag-view">
        <div class="tag-title">
            <span class="tag-score" v-if="props.tag">
                {{ props.tag?.score }}
            </span>
            <span class="tag-family">{{ props.family?.name }}</span>
        </div>
        <div class="text" contenteditable="true" :style="props.family?.cssStyle(18)">
            Hello world
        </div>
    </div>
</template>