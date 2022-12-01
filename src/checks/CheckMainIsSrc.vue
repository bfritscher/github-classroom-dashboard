<template>
  <a
    target="_blank"
    :href="`${repoUrl}/tree/${props.repo.hasMain ? 'main' : 'master'}`"
    >{{ props.repo.isMainSrc }}</a
  >
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI } from "../filters.js";

function checkMainSrc(repo) {
  repo.isMainSrc = false;
  return axios
    .get(
      `${toRepoAPI(repo.name)}/contents/?ref=${
        repo.hasMain ? "main" : "master"
      }`
    )
    .then((response) => {
      for (let i = 0; i < response.data.length; i++) {
        if (response.data[i].name.indexOf("package.json") === 0) {
          repo.isMainSrc = true;
          return;
        }
      }
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "MainIsSrc",
  check: checkMainSrc,
  isCorrect(repo) {
    return repo.isMainSrc;
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
