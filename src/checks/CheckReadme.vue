<template>
  <a target="_blank" :href="props.repo.readmeUrl">{{ props.repo.hasReadme }}</a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI } from "../filters.js";

function checkReadme(repo) {
  repo.hasReadme = false;
  repo.readmeUrl = "";
  return axios.get(`${toRepoAPI(repo.name)}/readme`).then((response) => {
    repo.hasReadme = response.data.name.indexOf(".md") > -1;
    repo.readmeUrl = response.data.html_url;
  });
}
function  isCorrect(repo) {
    return repo.hasReadme;
  }

export default {
  props: {
    repo: Object,
  },
  title: "Readme",
  check: checkReadme,
  isCorrect,
  total(repos) {
    return repos.filter((repo) => isCorrect(repo)).length;
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
