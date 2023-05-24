<script setup>
import { ref, computed } from "vue";
import { main } from "../main.js";
import SearchString from "../checks/SearchString.vue";
const search = ref("extension:js extension:vue ");
async function doSearch() {
  const args = { q: search.value };
  for (const repo of Object.values(main.assignments)) {
    await SearchString.check(repo, args);
  }
}
const sortedAssignments = computed(() => {
  return Object.values(main.assignments).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});
</script>

<template>
  <h2>Search</h2>
  <div class="submenu">
    <input
      type="text"
      v-model="search"
      autofocus
      class="search-input"
      @keydown.enter="doSearch"
    />
    <button class="btn" @click="doSearch">Search</button>
  </div>
  <div class="search-results">
    <div v-for="a in sortedAssignments" :key="a.name">
      <h3>{{ a.name }}</h3>
      <search-string
        :repo="a"
        :args="{ q: search, showDetails: true }"
      ></search-string>
    </div>
  </div>
</template>

<style scoped>
.search-input {
  width: 300px;
}
.search-results {
  padding: 1em;
}
</style>
