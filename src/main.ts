import Vue from 'vue'
import App from './App.vue'
import Panel from "./components/Panel.js";
import AddTag from "./components/AddTag.js";
import AddTags from "./components/AddTags.js";
import AddCategory from "./components/AddCategory.js";
import TagView from "./components/TagView.js";
import TagsByCategories from "./components/TagsByCategories.js";
import TagsByFont from "./components/TagsByFont.js";
import VFView from "./components/VFView.js";

import './assets/main.css'

Vue.component('panel', Panel);
Vue.component('add-tag', AddTag);
Vue.component('add-tags', AddTags);
Vue.component('add-category', AddCategory);
Vue.component('tags-by-categories', TagsByCategories);
Vue.component('tags-by-font', TagsByFont);
Vue.component('tag-view', TagView);
Vue.component('vf-view', VFView);

var app = new Vue({
  el: '#app',
  render: (h) => h(App)
});

