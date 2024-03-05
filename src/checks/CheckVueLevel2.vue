<template>
  <a target="_blank" :href="`${repoUrl}`" class="text-nowrap">
    {{ count }}
  </a>
  <div v-if="main.showDetails">
    <div
      v-for="(value, key) in repo.level2"
      :key="key"
      class="text-nowrap detail"
    >
      <b>{{ key }}:</b> <span>{{ value ? "✅" : "❌" }}</span>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { main } from "../main.js";

function checkIndex(repo) {
  repo.level2 = {};
  return Promise.all([
    axios
      .get(`${toRepoAPI(repo.name)}/contents/src/views/OrdersView.vue`)
      .then((response) => {
        const query = [
          "Search",
          "localStorage.getItem",
          "v-for",
          "delete",
          "status",
        ];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.level2[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/src/views/OrderAdd.vue`)
      .then((response) => {
        const query = [
          "localStorage.setItem",
          "v-model",
          "select",
          "this.newId()",
        ];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.level2[q] = html.includes(q);
        }
      }),
  ]);
}

export default {
  props: {
    repo: Object,
  },
  title: "Level2",
  check: checkIndex,
  setup(props) {
    return {
      props,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      count: computed(
        () => Object.values(props.repo.level2).filter((v) => v).length
      ),
    };
  },
};
</script>
<style scoped>
.detail {
  width: 150px;
  text-align: right;
}
b {
  float: left;
}
</style>
