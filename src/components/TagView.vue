<script setup lang="ts">
import { defineProps, onBeforeMount } from 'vue';
import type { PropType } from 'vue';
import { Font } from '../models';
import type { StaticTagging, Location } from '../models';
import { EventBus } from '@/eventbus';

const props = defineProps({
    family: Font,
    tag: Object as PropType<StaticTagging>,
    location: Object as PropType<Location>, // For one day when we handle variable taggings
});

onBeforeMount(() => {
    EventBus.$emit('ensure-loaded', props.family?.name);
});

const removeTag = () => {
    if (props.tag) {
        EventBus.$emit('remove-tag', props.family, props.tag);
    }
}

</script>


<template>
    <div class="tag-view">
        <div class="tag-title">
            <span class="tag-name">{{ props.tag?.tag.name }}
                <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -1000 960 960" fill="#000000">
                    <path d=" M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5
                    11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83
                    31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5
                    156T763-197q-54 54-127 85.5T480-80Z" />
                </svg>
            </span>
            <span class="tag-family">{{ props.family?.name }}</span>
            <span class="tag-score" v-if="props.tag">
                Score: <input type="number" v-model.lazy="props.tag.score" style="width: 60px;" />
            </span>
            <button @click="removeTag" class="remove-tag-btn">Remove</button>
        </div>
        <div class="text-editor" contenteditable="true" :style="props.family?.cssStyle(32)">
            Hello world
        </div>
    </div>
</template>