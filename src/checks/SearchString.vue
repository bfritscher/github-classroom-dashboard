<template>
  <div v-if="props.repo.search && props.repo.search[props.args[1]]">
    <a
      :href="`https://github.com/search?q=repo%3A${GITHUB_ORG}%2F${props.repo.name}+%28path%3A*.js+OR+path%3A*.vue+%29+${props.args[0]}&type=code`"
      target="_blank"
      >{{ props.repo.search[props.args[1]].total_count }}</a
    >
    <ul v-if="main.showDetails">
      <li
        v-for="(e, index) in props.repo.search[props.args[1]].items"
        :key="index"
      >
        <a :href="e.html_url" target="_blank">{{ e.path }}</a>
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
  const searchTxt = `${query}+in:file+extension:js+extension:vue+repo:${GITHUB_ORG}/${repo.name}`;
  return axios
    .get(`${API}search/code?q=${encodeURIComponent(searchTxt)}`)
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
    return { props, main, GITHUB_ORG };
  },
};
</script>
