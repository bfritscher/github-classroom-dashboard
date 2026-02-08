<template>
  <a
    target="_blank"
    :href="`${repoUrl}/blob/${repo.hasMain ? 'main' : 'master'}/${
      repo.baseDirOverride || ''
    }src/router/index.js`"
  >
    <div v-if="props.repo.routes" class="text-right">
      {{ props.repo.routes.length }}
    </div>
    <ul v-if="main.showDetails">
      <li v-for="name in props.repo.routes" :key="name">
        {{ name }}
      </li>
    </ul>
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { main } from "../main.js";

const regexRoutePath = /path:.*?["'](.+?)["']/g;

function checkRoutes(repo) {
  repo.routes = [];
  return axios
    .get(
      `${toRepoAPI(repo.name)}/contents/${
        repo.baseDirOverride || ""
      }src/router/index.js`
    )
    .then((response) => {
      const raw = b64DecodeUnicode(response.data.content);
      repo.routes = [...raw.matchAll(regexRoutePath)].map((m) => m[1]);
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "Routes",
  check: checkRoutes,
  setup(props) {
    return { props, main, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
