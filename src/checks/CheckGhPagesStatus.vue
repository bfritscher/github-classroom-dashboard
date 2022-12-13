<template>
  <span
    @click="checkGHPagesStatus(props.repo)"
    :class="{
      correct: props.repo.ghPagesStatus == 'built',
      wrong: !props.repo.ghPagesStatus || props.repo.ghPagesStatus != 'built',
    }"
  >
    <button
      v-if="!props.repo.ghPagesStatus && props.repo.hasGhPages"
      @click.prevent="enableGHPages()"
    >
      enable</button
    >{{ props.repo.ghPagesStatus }}
  </span>
</template>
<script>
import axios from "axios";
import { toRepoAPI } from "../filters.js";

function checkGHPagesStatus(repo) {
  repo.ghPagesStatus = "";
  return axios.get(`${toRepoAPI(repo.name)}/pages`).then((response) => {
    repo.ghPagesStatus = response.data.status;
  });
}

export default {
  props: {
    repo: Object,
  },
  title: "Status",
  check: checkGHPagesStatus,
  total(repos) {
    return repos.filter((r) => r.ghPagesStatus == "built").length;
  },
  setup(props) {
    function enableGHPages() {
      const req = {
        method: "POST",
        url: `${toRepoAPI(props.repo.name)}/pages`,
        headers: {
          Accept: "application/vnd.github.switcheroo-preview+json",
        },
        data: {
          source: {
            branch: "gh-pages",
          },
        },
      };
      axios(req).then(() => {
        setTimeout(() => {
          checkGHPagesStatus(props.repo);
        }, 1000);
      });
    }

    return { props, checkGHPagesStatus, enableGHPages };
  },
};
</script>
