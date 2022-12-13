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
import { toRepoAPI, toRepo } from "../filters.js";

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
function isCorrect(repo, args) {
  return repo["isRelease" + args[0]];
}

export default {
  props: {
    repo: Object,
    args: Array,
  },
  title: "Release",
  check: checkRelease,
  total(repos, args) {
    return repos.filter((repo) => isCorrect(repo, args)).length;
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
