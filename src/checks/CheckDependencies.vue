<template>
  <a
    target="_blank"
    :href="`${repoUrl}/blob/${repo.hasMain ? 'main' : 'master'}/${
      repo.baseDirOverride || ''
    }package.json`"
  >
    <div v-if="props.repo.dependencies" class="text-right">
      {{ Object.keys(props.repo.dependencies).length }}
    </div>
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
    .get(
      `${toRepoAPI(repo.name)}/contents/${
        repo.baseDirOverride || ""
      }package.json`
    )
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
  