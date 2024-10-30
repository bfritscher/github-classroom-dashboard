<template>
  <ul>
    <li v-for="p in props.repo.projects" :key="p.id">
      <a :href="p.url" target="_blank">{{ p.title }}</a>
    </li>
  </ul>
</template>
<script>
import axios from "axios";
import { main } from "../main.js";
import { GITHUB_ORG } from "../config";

function checkProjects(repo) {
  repo.projects = [];
  const query = `query {
  repository(owner: "${GITHUB_ORG}", name: "${repo.name}") {
    projectsV2(first: 10) {
      nodes {
        id
        title
        number
        url
				closed
      }
    }
  }
}`;
  return axios
    .post("https://api.github.com/graphql", {
      query,
    })
    .then((response) => {
      repo.projects = response.data.data.repository.projectsV2.nodes.filter(
        (p) => !p.closed
      );
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "Projects",
  isCorrect(repo) {
    return repo.projects?.some((p) => !p.closed && p.title === repo.name);
  },
  check: checkProjects,
  setup(props) {
    return { props, main };
  },
};
</script>
