<template>
  <a
    target="_blank"
    :href="props.repo.readmeUrl"
    v-if="props.repo.readmeMembers"
    >{{ props.repo.readmeMembers.length }}</a
  >
  <div v-for="u in props.repo.readmeMembers" :key="u" class="text-nowrap">
    {{ u }}
  </div>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI, b64DecodeUnicode } from "../filters.js";

function checkReadme(repo) {
  repo.hasReadme = false;
  repo.readmeMembers = [];
  repo.readmeUrl = "";
  return axios.get(`${toRepoAPI(repo.name)}/readme`).then((response) => {
    repo.hasReadme = response.data.name.indexOf(".md") > -1;
    const md = b64DecodeUnicode(response.data.content);
    const matches = md.matchAll(
      /(?<=#{1,6} (.*)\n(?:(?!#).*\n)*)(?=[+*-] (.*(?:\n(?![#+*-]).+)?))/g
    );
    repo.readmeMembers = [...matches]
      .filter((match) => match[1] === "Members")
      .map((match) => match[2].split("\n")[0].trim());
    repo.readmeUrl = response.data.html_url;
  });
}

export default {
  props: {
    repo: Object,
  },
  title: "Readme Members",
  check: checkReadme,
  setup(props) {
    return { props, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>
