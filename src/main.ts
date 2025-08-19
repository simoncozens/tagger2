import Vue from "vue";
import App from "./App.vue";
import "./assets/main.css";
import "vue-select/dist/vue-select.css";

import AddTags from "./components/AddTags.vue";
import CompactTagView from "./components/CompactTagView.vue";
import Panel from "./components/Panel.vue";
import TagView from "./components/TagView.vue";
import TagsByCategories from "./components/TagsByCategories.vue";
import TagsByFont from "./components/TagsByFont.vue";
import Todo from "./components/Todo.vue";
import vSelect from "vue-select";

Vue.component("v-select", vSelect);
Vue.component("panel", Panel);
Vue.component("add-tags", AddTags);
Vue.component("tags-by-categories", TagsByCategories);
Vue.component("tags-by-font", TagsByFont);
Vue.component("tag-view", TagView);
Vue.component("compact-tag-view", CompactTagView);
Vue.component("todo", Todo);

var app = new Vue({
  el: "#app",
  render: (h) => h(App),
});
