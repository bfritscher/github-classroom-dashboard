<template>
  <a
    target="_blank"
    :href="`${repoUrl}/${repo.hasMain ? 'main' : 'master'}/vite.config.js`"
  >
    {{ props.repo.viteConfigBase }}
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";

function checkVite(repo) {
  repo.viteConfigBase = "";
  repo.viteConfigBaseCorrect = false;
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/vite.config.js`)
    .then((response) => {
      const regexBase = /base:(.*?),/gms;
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

export default {
  props: {
    repo: Object,
  },
  title: "ViteConfig",
  check: checkVite,
  isCorrect(repo) {
    return repo.viteConfigBaseCorrect;
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
