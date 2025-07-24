<script setup lang="ts">
import { EventBus } from '@/eventbus';
import { Font, GF, TagDefinition, Tags } from '@/models';
import type { Exemplars } from '@/models';
import { computed, defineProps, ref } from 'vue';

interface Untagged {
    family: Font;
    tagname: string;
    tag_definition: TagDefinition;
    exemplars: Exemplars
}

const props = defineProps({
    gf: {
        type: GF,
        required: true
    },
    tags: {
        type: Tags,
        required: true
    }
})

const newScore = ref(0);

function useRefreshable<T>(getter: () => T): {
    getter(): T;
    refresh(): void;
} {
    const refreshKey = ref(0);

    return {
        getter() {
            refreshKey.value;
            return getter();
        },
        refresh() {
            refreshKey.value++;
        },
    };
}

const completeness = computed(() => {
    const families = props.gf.families;
    const uniqueTags = new Set<string>();
    for (var definition of Object.keys(props.gf.tagDefinitions)) {
        uniqueTags.add(definition);
    }
    for (var tag of props.tags.items) {
        uniqueTags.add(tag.tagName);
    }
    const tagnames = Array.from(uniqueTags);
    return (props.tags.items.length / (families.length * tagnames.length)) * 100;
});

function getNextUntagged(): Untagged | null {
    const families = props.gf.families;
    const tagnames = Object.keys(props.gf.tagDefinitions);
    if (completeness.value >= 100) {
        return null; // All fonts are tagged
    }
    while (true) {
        // Grab a random family
        const family = families[Math.floor(Math.random() * families.length)];
        // Grab a random tagname
        const tagname = tagnames[Math.floor(Math.random() * tagnames.length)];
        // If the family is not tagged with the tagname, return it
        if (!props.tags.has(family.name, tagname)) {
            EventBus.$emit('ensure-loaded', family.name);
            return {
                family,
                tagname: tagname,
                tag_definition: props.gf.tagDefinitions[tagname],
                exemplars: props.gf.tagDefinitions[tagname].exemplars(props.tags)
            };
        }
    }
}

const randomUntaggedRefreshable = useRefreshable(getNextUntagged);
const randomUntagged = computed(randomUntaggedRefreshable.getter);
</script>

<template>
    <div id="todo-wrapper">
        <div v-if="!randomUntagged">All fonts are tagged!</div>

        <div v-else>
            <div class="progressbar">
                <div class="progress" :style="{ width: completeness + '%' }">
                </div>
                <div class="progress-text">
                    Tagging is {{ completeness.toFixed(2) }}% complete...
                </div>
            </div>

            <h1>Is
                <span class="family" :style="{ fontFamily: randomUntagged.family.name }">{{ randomUntagged.family.name
                }}</span>
                &nbsp;<span class="tag-name">{{ randomUntagged.tagname
                    }}</span>?
            </h1>
            <h3>({{ randomUntagged.tag_definition.superShortDescription }})</h3>

            <div class="sample" contenteditable="true" :style="{ fontFamily: randomUntagged.family.name }"
                style="border: 1px solid #ccc; padding: 1em;">
                Grumpy wizards make toxic brew for the evil Queen and Jack.
            </div>

            <p v-html="randomUntagged.tag_definition.description"></p>

            <div class="exemplars">
                <div class="exemplars-low">
                    <h3 v-if="randomUntagged.exemplars.low.length">Examples of <i>low</i> {{ randomUntagged.tagname
                        }}</h3>
                    <div v-for="tag in randomUntagged.exemplars.low" :key="tag.family.name + tag.tagName + tag.score">
                        <compact-tag-view :tag="tag"></compact-tag-view>
                    </div>
                </div>
                <div class="exemplars-medium">
                    <h3 v-if="randomUntagged.exemplars.medium.length">Examples of <i>medium</i> {{
                        randomUntagged.tagname
                        }}</h3>
                    <div v-for="tag in randomUntagged.exemplars.medium"
                        :key="tag.family.name + tag.tagName + tag.score">
                        <compact-tag-view :tag="tag"></compact-tag-view>
                    </div>
                </div>
                <div class="exemplars-high">
                    <h3 v-if="randomUntagged.exemplars.high.length">Examples of <i>high</i> {{ randomUntagged.tagname
                        }}</h3>
                    <div v-for="tag in randomUntagged.exemplars.high" :key="tag.family.name + tag.tagName + tag.score">
                        <compact-tag-view :tag="tag"></compact-tag-view>
                    </div>
                </div>
            </div>

            <p>
            <div class="rangeslider">
                <input type="range" v-model="newScore" min="0" max="100" step="1" style="vertical-align: middle;">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
                <span>50</span>
                <span>60</span>
                <span>70</span>
                <span>80</span>
                <span>90</span>
                <span>100</span>
            </div>
            <input type="number" v-model="newScore" placeholder="Score (0-100)">
            <button @click="props.tags.addTag(randomUntagged.tagname, randomUntagged.family.name, [], newScore)">
                Tag it!</button>
            </p>

            <button @click="randomUntaggedRefreshable.refresh">Give me another</button>
        </div>
    </div>
</template>
