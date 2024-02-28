<template>
  <a target="_blank" :href="`${repoUrl}/blob/index.html`" class="text-nowrap">
    {{ count }}
  </a>
  <div v-if="main.showDetails">
    <div
      v-for="(value, key) in repo.level1"
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
  repo.level1 = {};
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/index.html`)
    .then((response) => {
      const query = [
        "Products",
        "data()",
        "methods",
        "computed",
        "axios",
        "fetch",
      ];
      const html = b64DecodeUnicode(response.data.content);
      for (const q of query) {
        repo.level1[q] = html.includes(q);
      }
      const addToCartRegex = new RegExp("add\\s*to\\s*cart", "i");
      repo.level1["addToCart"] = addToCartRegex.test(html);
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "Level1",
  check: checkIndex,
  setup(props) {
    return {
      props,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      count: computed(
        () => Object.values(props.repo.level1).filter((v) => v).length
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
