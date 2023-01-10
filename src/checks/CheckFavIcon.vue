<template>
  <a
    target="_blank"
    :href="`${repoUrl}/blob/gh-pages/index.html`"
    class="text-nowrap favicon"
  >
    <img v-if="props.repo.favicon" :src="props.repo.favicon" />
    <span v-else>false</span>
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { GITHUB_ORG } from "../config.js";

function checkIndex(repo) {
  repo.favicon = false;
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/index.html?ref=gh-pages`)
    .then((response) => {
      const refexFavicon = /rel=".*?icon" href="(.*?)"/gm;
      const html = b64DecodeUnicode(response.data.content);
      let match = refexFavicon.exec(html);
      if (match) {
        repo.favicon = `https://${GITHUB_ORG}.github.io/${match[1]}`;
      } else {
        repo.favicon = false;
      }
    });
}
function isCorrect(repo) {
  return !!repo.favicon;
}

export default {
  props: {
    repo: Object,
  },
  title: "Favicon",
  check: checkIndex,
  isCorrect,
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>

<style>
.favicon {
  width: ;
}
.favicon img {
  width: 100%;
}
</style>