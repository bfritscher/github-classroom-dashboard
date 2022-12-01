<template>
  <a
    target="_blank"
    :href="`${repoUrl}/tree/${
      props.repo['isRelease' + props.args[0] + '_sha']
    }`"
  >
    {{ props.repo["isRelease" + props.args[0]] }}</a
  >
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI } from "../filters.js";

function checkRelease(repo, tag) {
  repo[`isRelease${tag}`] = false;
  repo[`isRelease${tag}_sha`] = "";
  return axios.get(`${toRepoAPI(repo.name)}/tags`).then((response) => {
    repo.releases = response.data.map(function (release) {
      if (release.name === tag) {
        repo[`isRelease${tag}`] = true;
        repo[`isRelease${tag}_sha`] = release.commit.sha;
      }
      return release.name;
    });
  });
}

export default {
  props: {
    repo: Object,
    args: Array,
  },
  title: "Release",
  check: checkRelease,
  isCorrect(repo, args) {
    return repo["isRelease" + args[0]];
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
