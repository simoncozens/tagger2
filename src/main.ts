import Vue from 'vue'
import App from './App.vue'

import './assets/main.css'

  import { GF, Tags, FontTag, FontTagGroup } from './models.js';
  import TagsByFont from "./components/TagsByFont.js";
  import TagsByCategories from "./components/TagsByCategories.js";
  import Panel from "./components/Panel.js";
  import TagView from "./components/TagView.js";
  import AddTag from "./components/AddTag.js";
  import AddTags from "./components/AddTags.js";
  import AddCategory from "./components/AddCategory.js";
  import VFView from "./components/VFView.js";
  import { linter } from "./linter.js";

  Vue.component('tags-by-font', TagsByFont);
  Vue.component('tags-by-categories', TagsByCategories);
  Vue.component('panel', Panel);
  Vue.component('tag-view', TagView);
  Vue.component('add-tag', AddTag);
  Vue.component("add-tags", AddTags);
  Vue.component('add-category', AddCategory);
  Vue.component('vf-view', VFView);
  
  var app = new Vue({
    el: '#app',
    render: (h) => h(App),
    data: {
      gf: null,
      tags: null,
      tagGroups: [],
      panels: [
        { type: 'font', font: 'Roboto' },
        { type: 'categories', categories: ['/Expressive/Loud', '/Expressive/Childlike'] }
      ],
    },
    methods: {
      addFontPanel(font) {
        this.panels.push({ type: 'font', font });
      },
      addCategoriesPanel(categories) {
        this.panels.push({ type: 'categories', categories , tagGroups: this.tagGroups });
      },
      addVFViewPanel() {
        this.panels.push({ type: 'vf-view', families: this.gf.families });
      },
      removePanel(idx) {
        this.panels.splice(idx, 1);
      },
      removeTag(tag) {
        const index = this.tags.items.indexOf(tag)
        if (index !== -1) {
          this.tags.items.splice(index, 1);
        }
      },
      addTag(tag) {
        const family = this.gf.families.find(f => f.name === tag.family);
        tag.family = family
        this.tags.items.push(tag);
      },
      addTags(filterSet) {
        for (let family of this.gf.families) {
          let addFamily = false;
          for (let axis of family.axes) {
            if (
              filterSet.lowTag.filters.some(f => f.axis == axis.tag) &&
              filterSet.highTag.filters.some(f => f.axis == axis.tag) &&
              filterSet.lowTag.filters.some(f => f.value >= axis.min) &&
              filterSet.highTag.filters.some(f => f.value <= axis.max)
            ) {
              addFamily = true;
            }
          }
          if (addFamily) {
            for (let category of filterSet.categories) {
              const lowTag = new FontTag(category, family, [{tag: "wght", value: 100}], filterSet.lowTag.score);
              const highTag = new FontTag(category, family, [{tag: "wght", value: 900}], filterSet.highTag.score);
              const fontTag = new FontTagGroup();
              fontTag.addTag(lowTag);
              fontTag.addTag(highTag);
              this.tagGroups.push(fontTag);
            }
          }
        }
      },
      addCategory(category) {
        console.log("Adding category", category);
        if (!this.tags.categories.includes(category)) {
          this.tags.categories.push(category);
        }
      },
    },
    computed: {
      categories() {
        return this.tags ? this.tags.categories : [];
      }
    },
    async created() {
      // Load the GF and Tags classes
      this.gf = new GF();
      await this.gf.getFamilyData();
      await this.gf.getLintRules();
      await this.gf.getTagDefinitions();
      this.gf.loadFamilies();
      this.gf.linter = linter;
      this.tags = new Tags(this.gf);
      this.tags.sortCategories();

      // Subscribe to events
      this.$root.$on("remove-tag", this.removeTag);
      const family = this.gf.families.find(f => f.name === 'Maven Pro');
      const tag1 = new FontTag('/Purpose/Easy Reading', family, [{tag: "wght", value: 400}], 10);
      const tag2 = new FontTag('/Purpose/Easy Reading', family, [{tag: "wght", value: 900}], 100);
      const tagGroup = new FontTagGroup();
      tagGroup.addTag(tag1);
      tagGroup.addTag(tag2);
      this.tagGroups.push(tagGroup);
    }
  });
