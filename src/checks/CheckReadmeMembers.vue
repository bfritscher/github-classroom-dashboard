<template>
  <a target="_blank" :href="props.repo.readmeUrl" v-if="props.repo.readmeEmail">
    <div v-for="u in props.repo.readmeEmail" :key="u" class="text-nowrap">
      {{ u }}
    </div>
  </a>
  <div v-if="main.showDetails" class="detail">
    <div v-for="u in props.repo.readmeSkills" :key="u" class="text-nowrap">
      {{ u }}
    </div>
  </div>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { toRepoAPI, b64DecodeUnicode } from "../filters.js";
import { main } from "../main.js";

function checkReadme(repo) {
  repo.hasReadme = false;
  repo.readmeEmail = [];
  repo.readmeSkills = [];
  repo.readmeUrl = "";
  return axios.get(`${toRepoAPI(repo.name)}/readme`).then((response) => {
    repo.hasReadme = response.data.name.indexOf(".md") > -1;
    const md = b64DecodeUnicode(response.data.content);
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    repo.readmeEmail = [...md.matchAll(emailRegex)].map((match) => match[1]);
    const skillsRegex = /- (.*)/g;
    repo.readmeSkills = [...md.matchAll(skillsRegex)].map((match) => match[1]);
    repo.readmeUrl = response.data.html_url;
  });
}

export default {
  props: {
    repo: Object,
  },
  title: "Readme",
  check: checkReadme,
  setup(props) {
    return { props, main, repoUrl: computed(() => toRepoAPI(props.repo.name)) };
  },
};
</script>

<style scoped>
.detail {
  max-width: 300px;
  overflow: hidden;
}
</style>
