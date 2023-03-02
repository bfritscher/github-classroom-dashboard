<template>
  <a
    target="_blank"
    :href="props.repo.readmeUrl"
    v-if="props.repo.readmeImages"
    >{{ props.repo.readmeImages?.length }}</a
  >
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { main } from "../main.js";
import { toRepoAPI, toRepo, b64DecodeUnicode } from "../filters.js";

function checkReadme(repo) {
  repo.readmeImages = [];
  return axios.get(`${toRepoAPI(repo.name)}/readme`).then((response) => {
    repo.readmeUrl = response.data.html_url;
    const md = b64DecodeUnicode(response.data.content);
    const mockups = md.split("## Mockups")[1];
    const matches = mockups.matchAll(/!\[.*?\]\((.*?)\)/g);
    repo.readmeImages = [...matches].map((match) => {
      let url = match[1];
      if (url.startsWith("http")) {
        return url;
      } else {
        return `${toRepo(repo.name)}/raw/main/${url}`;
      }
    });
  });
}

function isCorrect(repo) {
  return repo.readmeImages?.length > 0;
}

export default {
  props: {
    repo: Object,
  },
  title: "Readme Mockups Images",
  check: checkReadme,
  isCorrect,
  setup(props) {
    return { props, main, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
<style scoped>
.mock {
  width: 80px;
  margin-right: 10px;
  vertical-align: middle;
}
.mock:hover {
  width: 300px;
}
</style>
