<script setup lang="ts">
export type Filter = {
    axis: string;
    op: string;
    value: number;
    score: number;
};
export type Condition = {
    filters: Filter[];
    score: number;
}
export type FilterSet = {
    lowTag: Condition;
    highTag: Condition;
    categories: string[];
};
import { Font } from "../models";
import { computed, defineProps, ref, defineEmits } from 'vue';


const props = defineProps({ 
    gf: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['tags-added']);

let currentCategories = ref<string[]>([]);
let lowTag = ref<{ filters: Filter[], score: number }>({ filters: [], score: 0 });
let highTag = ref<{ filters: Filter[], score: number }>({ filters: [], score: 0 });
let currentLowAxis = ref("");
let currentLowPosition = ref(0);
let currentLowOp = ref("");
let currentLowScore = ref(0);
let currentHighAxis = ref("");
let currentHighPosition = ref(0);
let currentHighOp = ref("");
let currentHighScore = ref(0);


function addFilter() {
    lowTag.value.filters.push(
        {
            axis: currentLowAxis.value,
            op: currentLowOp.value,
            value: currentLowPosition.value,
            score: currentLowScore.value
        }
    );
    highTag.value.filters.push(
        {
            axis: currentHighAxis.value,
            op: currentHighOp.value,
            value: currentHighPosition.value,
            score: currentHighScore.value
        }
    );
    currentLowAxis.value = "";
    currentLowPosition.value = 0;
    currentLowOp.value = "";
    currentHighAxis.value = "";
    currentHighPosition.value = 0;
    currentHighOp.value = "";
}

function addTags() {
    const filterSet = {
        categories: currentCategories.value,
        lowTag: lowTag.value,
        highTag: highTag.value
    };
    filterSet.lowTag.score = currentLowScore.value;
    filterSet.highTag.score = currentHighScore.value;
    emit('tags-added', filterSet);
    currentCategories.value = [];
    lowTag.value = { filters: [], score: 0 };
    highTag.value = { filters: [], score: 0 };
    currentLowAxis.value = "";
    currentLowPosition.value = 0;
    currentLowOp.value = "";
    currentLowScore.value = 0;
    currentHighAxis.value = "";
    currentHighPosition.value = 0;
    currentHighOp.value = "";
    currentHighScore.value = 0;
}
</script>
<template>
    <div class="frame">
        <h3>Add Tags</h3>
        <div>
            <h3>Categories</h3>
            <select v-model="currentCategories" multiple>
                <option v-for="definition in Object.keys(gf.tagDefinitions).sort()">
                    {{ definition }}
                </option>
            </select>
            <h3>Low Tag:</h3>
            Score:
            <input type="number" v-model="currentLowScore" placeholder="Score" />
            <br>
            <input type="text" v-model="currentLowAxis" placeholder="Axis name" />
            <input type="number" v-model="currentLowPosition" placeholder="Position" />
            <select v-model="currentLowOp">
                <option value="<=">&lt;=</option>
                <option value=">=">&gt;=</option>
                <option value="=">=</option>
            </select>

            <h3>High Tag:</h3>
            Score:
            <input type="number" v-model="currentHighScore" placeholder="Score" />
            <br>
            <input type="text" v-model="currentHighAxis" placeholder="Axis name" />
            <input type="number" v-model="currentHighPosition" placeholder="Position" />
            <select v-model="currentHighOp">
                <option value="<=">&lt;=</option>
                <option value=">=">&gt;=</option>
                <option value="=">=</option>
            </select>
            <button @click="addFilter">Add Filter</button>
        </div>
        <div>
            <h3>Current Filters</h3>
            <h3>Low Tag</h3>
            <ul>
                <li v-for="filter in lowTag.filters" :key="filter.axis + filter.value">
                    {{ filter.axis }} {{ filter.op }} {{ filter.value }}
                    <button @click="lowTag.filters.splice(lowTag.filters.indexOf(filter), 1)">Remove</button>
                </li>
            </ul>
            <h3>High Tag</h3>
            <ul>
                <li v-for="filter in highTag.filters" :key="filter.axis + filter.value">
                    {{ filter.axis }} {{ filter.op }} {{ filter.value }}
                    <button @click="highTag.filters.splice(highTag.filters.indexOf(filter), 1)">Remove</button>
                </li>
            </ul>
        </div>
        <button @click="addTags">Add Tags</button>
    </div>
</template>