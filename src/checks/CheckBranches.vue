<template>
  <div class="text-right">{{ props.repo.branches?.length }}</div>
  <ul v-if="main.showDetails">
    <li v-for="branch in props.repo.branches" :key="branch">{{ branch }}</li>
  </ul>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";

function checkBranches(repo) {
  repo.hasMaster = false;
  repo.hasMain = false;
  repo.hasGhPages = false;
  repo.branches = [];
  return axios.get(`${toRepoAPI(repo.name)}/branches`).then((response) => {
    repo.branches = response.data.map((branch) => {
      if (branch.name === "gh-pages") {
        repo.hasGhPages = true;
      }
      if (branch.name === "main") {
        repo.hasMain = true;
      }
      if (branch.name === "master") {
        repo.hasMaster = true;
      }
      return branch.name;
    });
  });
}

export default {
  props: {
    repo: Object,
  },
  title: "Branches",
  check: checkBranches,
  setup(props) {
    return { props, main, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
