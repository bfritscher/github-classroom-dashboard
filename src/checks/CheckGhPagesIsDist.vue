<template>
  <a target="_blank" :href="repoUrl">{{ props.repo.ghPagesIsDist }}</a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI } from "../filters.js";
import { GITHUB_ORG } from "../config.js";

function checkGhPagesIsDist(repo) {
  repo.ghPagesIsDist = false;
  return axios
    .get(`${toRepoAPI(repo.name)}/contents/assets?ref=gh-pages`)
    .then((response) => {
      for (let i = 0; i < response.data.length; i++) {
        if (
          response.data[i].name.indexOf("index") === 0 &&
          (response.data[i].name.split(".").length === 3 ||
            response.data[i].name.split("-").length === 2)
        ) {
          repo.ghPagesIsDist = true;
          return;
        }
      }
    });
}
function isCorrect(repo) {
  return repo.ghPagesIsDist;
}

export default {
  props: {
    repo: Object,
  },
  title: "GhPagesIsDist",
  check: checkGhPagesIsDist,
  isCorrect,
  total(repos) {
    return repos.filter((repo) => isCorrect(repo)).length;
  },
  setup(props) {
    return {
      props,
      repoUrl: computed(
        () => `https://${GITHUB_ORG}.github.io/${props.repo.name}`
      ),
    };
  },
};
</script>
