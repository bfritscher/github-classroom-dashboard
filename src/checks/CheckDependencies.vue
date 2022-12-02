<template>
  <a
    target="_blank"
    :href="`${repoUrl}/blob/${repo.hasMain ? 'main' : 'master'}/package.json`"
  >
    <span v-if="props.repo.dependencies">{{
      Object.keys(props.repo.dependencies).length
    }}</span>
    <ul v-if="main.showDetails">
      <li v-for="(version, name) in props.repo.dependencies" :key="name">
        {{ name }}: {{ version }}
      </li>
    </ul>
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { main } from "../main.js";

function checkDependencies(repo) {
  repo.dependencies = {};
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/package.json`)
    .then((response) => {
      const raw = b64DecodeUnicode(response.data.content);
      const packageJson = JSON.parse(raw);
      repo.dependencies = packageJson.dependencies;
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "Dependencies",
  check: checkDependencies,
  setup(props) {
    return { props, main, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
