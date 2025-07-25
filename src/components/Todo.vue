<script setup lang="ts">
import { EventBus } from '@/eventbus';
import { Font, GF, Tag } from '@/models';
import type { Exemplars } from '@/models';
import { computed, defineProps, ref } from 'vue';

interface Untagged {
    font: Font;
    tagname: string;
    tag: Tag;
    exemplars: Exemplars
}

const props = defineProps({
    gf: {
        type: GF,
        required: true
    },
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

const tagNames = computed(() => {
    return props.gf.uniqueTagNames().filter(tagName => {
        // Don't include '/Quant/'
        return !tagName.startsWith('/quant/');
    });
});

const completeness = computed(() => {
    console.log("Calculating completeness...");
    const families = props.gf.families;
    const uniqueTags = tagNames.value;
    const totalTaggings = families.map(family => family.taggings.length).reduce((a, b) => a + b, 0);
    return (totalTaggings / (families.length * uniqueTags.length)) * 100;
});

function getNextUntagged(): Untagged | null {
    const families = props.gf.families;
    const uniqueTags = tagNames.value;
    if (completeness.value >= 100) {
        return null; // All fonts are tagged
    }
    while (true) {
        // Grab a random family
        const family = families[Math.floor(Math.random() * families.length)];
        // Grab a random tagname
        const tagname = uniqueTags[Math.floor(Math.random() * uniqueTags.length)];
        if (!props.gf.tags[tagname]) {
            console.warn("Tag with no definition!!", tagname);
            continue
        }
        // If the family is not tagged with the tagname, return it
        if (!family.hasTagging(tagname)) {
            EventBus.$emit('ensure-loaded', family.name);
            return {
                font: family,
                tagname: tagname,
                tag: props.gf.tags[tagname],
                exemplars: props.gf.tags[tagname].exemplars(props.gf)
            };
        }
    }
}

function tagIt(untagged: Untagged, score: number) {
    const family = untagged.font;
    const tag = props.gf.tags[untagged.tagname];
    if (!family || !tag) {
        console.error("Family or tag not found for tagging.");
        return;
    }
    const tagging = family.taggings.find(t => t.tag.name === tag.name);
    if (tagging) {
        console.log(`We already have a tagging for ${tag.name} in ${family.name}, can't happen.`);
        return;
    } else {
        family.addTagging({ font: family, tag, score });
    }
    console.log(`There are now ` + props.gf.allTaggings.length + ` taggings in the GF.`);
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
                    Tagging is {{ completeness.toFixed(3) }}% complete...
                </div>
            </div>

            <h1>Is
                <span class="family" :style="{ fontFamily: randomUntagged.font.name }">{{ randomUntagged.font.name
                }}</span>
                a {{ randomUntagged.tag.friendlyName }} font?

            </h1>
            <h3 v-if="randomUntagged.tag.superShortDescription">({{ randomUntagged.tag.superShortDescription }})</h3>

            <div class="sample" contenteditable="true" :style="{ fontFamily: randomUntagged.font.name }"
                style="border: 1px solid #ccc; padding: 1em;">
                Grumpy wizards make toxic brew for the evil Queen and Jack.
            </div>

            <p v-html="randomUntagged.tag.description"></p>

            <div class="exemplars">
                <div class="exemplars-low" v-if="randomUntagged.exemplars.low.length">
                    <h3>Examples of <i>low</i> {{ randomUntagged.tagname }}</h3>
                    <div v-for="tagging in randomUntagged.exemplars.low"
                        :key="tagging.font.name + tagging.tag.name + tagging.score">
                        <compact-tag-view :tag="tagging"></compact-tag-view>
                    </div>
                </div>
                <div class="exemplars-medium" v-if="randomUntagged.exemplars.medium.length">
                    <h3>Examples of <i>medium</i> {{ randomUntagged.tagname }}</h3>
                    <div v-for="tag in randomUntagged.exemplars.medium" :key="tag.font.name + tag.tag.name + tag.score">
                        <compact-tag-view :tag="tag"></compact-tag-view>
                    </div>
                </div>
                <div class="exemplars-high" v-if="randomUntagged.exemplars.high.length">
                    <h3>Examples of <i>high</i> {{ randomUntagged.tagname }}</h3>
                    <div v-for="tag in randomUntagged.exemplars.high" :key="tag.font.name + tag.tag.name + tag.score">
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
            <button @click="tagIt(randomUntagged, newScore)">
                Tag it!</button>
            </p>

            <button @click="randomUntaggedRefreshable.refresh">Give me another</button>
        </div>
    </div>
</template>
