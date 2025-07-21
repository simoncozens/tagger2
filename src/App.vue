<template>
  <div id="app">
    <div id="fonts">
      <link v-for="family in gf && gf.families ? gf.families : []" :href="family.url" rel="stylesheet">
    </div>
    <button @click="addFontPanel('Maven Pro')">Tags in font</button>
    <button @click="addCategoriesPanel(['/Expressive/Loud'])">Tags in category</button>
    <button @click="addVFViewPanel()">Font explorer</button>
    <button @click="addFontPanel('Maven Pro')">Add Font View</button>
    <button @click="addCategoriesPanel(['/Expressive/Loud'])">Add Tag View</button>
    <add-tag :categories="categories" @tag-added="addTag"></add-tag>
    <add-tags :categories="categories" @tags-added="addTags"></add-tags>
    <add-category @category-added="addCategory"></add-category>
    <div style="display: flex; flex-direction: row; width: 100vw; min-height: 100vh;">
      <div v-for="(panel, idx) in panels" :key="idx" :style="{ flex: '1 1 0', minWidth: 0, borderRight: idx < panels.length - 1 ? '1px solid #eee' : 'none', height: '100vh', overflow: 'auto' }">
        <panel
          :panel="panel"
          :tags="tags && tags.items ? tags.items : []"
          @remove="removePanel(idx)"
        ></panel>
      </div>
    </div>
  </div>
</template>

