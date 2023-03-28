<template>
  <a target="_blank" :href="`${repoUrl}/blob/main/events.md`">
    {{ props.repo.hasEvents ? "✅" : "❌" }}
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepo, toRepoAPI, b64DecodeUnicode } from "../filters.js";

function checkEvents(repo) {
  repo.hasEvents = false;
  return axios.get(`${toRepoAPI(repo.name)}/contents/events.md`).then((response) => {
    repo.hasEvents = true;
    /*
    const md = b64DecodeUnicode(response.data.content);
    const matches = md.matchAll(
      /(?<=#{1,6} (.*)\n(?:(?!#).*\n)*)(?=[+*-] (.*(?:\n(?![#+*-]).+)?))/g
    );
    */
  });
}

function isCorrect(repo) {
  return repo.hasEvents;
}

export default {
  props: {
    repo: Object,
  },
  title: "Events",
  check: checkEvents,
  isCorrect,
  total(repos) {
    return repos.reduce((total, repo) => {
      return total + (repo.hasEvents ? 1 : 0);
    }, 0);
  },
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>
