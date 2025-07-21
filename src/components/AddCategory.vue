<script setup language="ts">
import { ref } from 'vue';

const category = ref(""); // Input for new category
const emit = defineEmits(['category-added']); // Emit event to parent component

function addCategory() {
  if (category.value.trim() === "") {
    alert("Category name cannot be empty.");
    return;
  }
  // Emit an event to the parent component to add the category
  emit('category-added', category.value.trim());
  category.value = ""; // Reset the input field after adding
}
</script>
<template>
  <div class="frame">
    <h3>Add new category</h3>
    <input type="text" v-model="category" placeholder="Category" />
    <button @click="addCategory">Add</button>
  </div>
</template>
