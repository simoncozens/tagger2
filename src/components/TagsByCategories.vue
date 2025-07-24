<script>
export default {
  props: ['tags', 'categories', 'tagGroups'],
  data() {
    return {
      selectedCategories: [...this.categories],
      sortBy: 'family', // Default sorting option
      tagFilter: '',
      reverseTags: false
    };
  },
  watch: {
    categories(newVal) {
      this.selectedCategories = [...newVal];
    }
  },
  computed: {
    filteredTags() {
      // Use selectedCategories for filtering
      let filtered = this.tags.filter(tag => this.selectedCategories.includes(tag.tagName));
      // Sort by family name and tag name
      if (this.sortBy === 'score') {
        filtered = filtered.sort((a, b) => b.score - a.score);
      }
      if (this.sortBy === 'family') {
        filtered = filtered.sort((a, b) => {
          if (a.family.name < b.family.name) return -1;
          if (a.family.name > b.family.name) return 1;
          if (a.tagName < b.tagName) return -1;
          if (a.tagName > b.tagName) return 1;
          return 0;
        });
      }
      if (this.sortBy === 'popularity' || this.sortBy === 'trending') {
        const familyData = this.$attrs.gf.familyData;
        filtered = filtered.sort((a, b) => {
          const aVal = Number(familyData[a.family.name]?.[this.sortBy]) || 0;
          const bVal = Number(familyData[b.family.name]?.[this.sortBy]) || 0;
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
        });
      }


      if (this.tagFilter !== "") {
        const myRegex = new RegExp(this.tagFilter, "i");
        debugger;
        filtered = filtered.filter(tag => myRegex.test(tag.family.name));
      }
      if (this.reverseTags) {
        filtered.reverse();
      }
      return filtered;
    },
    sortedCategories() {
      const res = this.tags.map(tag => tag.tagName)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      return res;
    }
  },
  methods: {
    removeTag(tag) {
      this.$emit('remove-tag', tag);
    }
  }
};
</script>
<template>
  <div>
    <h3>Tags for categories:</h3>
    <div>
      <select v-model="selectedCategories" multiple>
        <option v-for="category in sortedCategories" :key="category">
          {{ category }}
        </option>
      </select>
      <label for="sortBy">Sort by:</label>
      <select id="sortBy" v-model="sortBy">
        <option value="family">Family</option>
        <option value="score">Score</option>
        <option value="popularity">Popularity</option>
        <option value="trending">Trending</option>
      </select>
      <button @click="reverseTags = !reverseTags">
        Reverse Order
      </button>
      <input type="text" v-model="tagFilter" placeholder="Filter tags by name" />
    </div>
    <div v-for="tag in filteredTags" :key="tag.family.name + tag.tagName + tag.score">
      <tag-view :tag="tag" @remove-tag="removeTag"></tag-view>
    </div>
    <div v-for="group in tagGroups" :key="group.name">
      <div v-for="tag in group.tags" :key="tag.tagName + tag.family.name + tag.score"
        style="background-color: lightgray;">
        <tag-view :tag="tag" @remove-tag="removeTag"></tag-view>
      </div>
    </div>
  </div>
</template>