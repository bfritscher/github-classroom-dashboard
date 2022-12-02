<template>
  <div v-if="props.repo.search[props.args[1]]">
    {{ props.repo.search[props.args[1]].total_count }}
    <ul v-if="main.showDetails">
      <li
        v-for="(e, index) in props.repo.search[props.args[1]].items"
        :key="index"
      >
        <a :href="e.html_url">{{ e.path }}</a>
      </li>
    </ul>
  </div>
</template>
<script>
import axios from "axios";
import { API, GITHUB_ORG } from "../config.js";
import { main } from "../main.js";

function searchString(repo, query, key) {
  if (!Object.prototype.hasOwnProperty.call(repo, "search")) {
    repo.search = {};
  }
  repo.search[key] = { total_count: -1, items: [] };
  return axios
    .get(
      `${API}search/code?q=${query}+in:file+extension:js+extension:vue+repo:${GITHUB_ORG}/${repo.name}`
    )
    .then((response) => {
      repo.search[key] = response.data;
    });
}

export default {
  props: {
    repo: Object,
    args: Array,
  },
  title: "Search",
  check: searchString,
  setup(props) {
    return { props, main };
  },
};
</script>
