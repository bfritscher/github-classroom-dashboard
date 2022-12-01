<template>
  <a target="_blank" :href="`${repoUrl}/gh-pages/index.html`">
    {{ props.repo.title }}
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";

function checkIndex(repo) {
  repo.title = false;
  repo.style = "";
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/index.html?ref=gh-pages`)
    .then((response) => {
      const regexTitle = /title>(.*?)<\/title/gm;
      const regexStyle = /style="[^w](.*?)"/gm;
      const html = b64DecodeUnicode(response.data.content);
      let match = regexTitle.exec(html);
      if (match) {
        repo.title = match[1];
      }
      match = regexStyle.exec(html);
      if (match) {
        repo.style = match[1];
      } else {
        repo.style = "";
      }
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "Title",
  check: checkIndex,
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
