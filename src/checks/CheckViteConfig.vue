<template>
  <a
    target="_blank"
    :href="`${repoUrl}/blob/${repo.hasMain ? 'main' : 'master'}/vite.config.js`"
  >
    {{ main.showDetails ? props.repo.viteConfigBase : isCorrect(props.repo) }}
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { main } from "../main.js";

function checkVite(repo) {
  repo.viteConfigBase = "";
  repo.viteConfigBaseCorrect = false;
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/vite.config.js`)
    .then((response) => {
      const regexBase = /base:(.*?)$/gms;
      const js = b64DecodeUnicode(response.data.content);
      let match = regexBase.exec(js);
      if (match) {
        repo.viteConfigBase = match[1];
        repo.viteConfigBaseCorrect = repo.viteConfigBase.includes(
          `/${repo.name}/`
        );
      }
    });
}

function isCorrect(repo) {
  return repo.viteConfigBaseCorrect;
}

export default {
  props: {
    repo: Object,
  },
  title: "ViteConfig",
  check: checkVite,
  isCorrect,
  total(repos) {
    return repos.filter((repo) => isCorrect(repo)).length;
  },
  setup(props) {
    return {
      props,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      isCorrect,
    };
  },
};
</script>
