<template>
  <div v-if="props.repo.search && props.repo.search[props.args.q]">
    <a
      :href="`https://github.com/search?q=repo%3A${GITHUB_ORG}%2F${props.repo.name}+${props.args.q}&type=code`"
      target="_blank"
      >{{ props.repo.search[props.args.q].total_count }}</a
    >
    <ul v-if="main.showDetails">
      <li
        v-for="(e, index) in props.repo.search[props.args.q].items"
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

function searchString(repo, args) {
  if (!Object.prototype.hasOwnProperty.call(repo, "search")) {
    repo.search = {};
  }
  repo.search[args.q] = { total_count: -1, items: [] };
  const searchTxt = `${args.q} repo:${GITHUB_ORG}/${repo.name}`;
  //const searchTxt = `addClass in:file+language:js+repo:jquery/jquery`;
  return axios
    .get(`${API}search/code?q=${encodeURIComponent(searchTxt)}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    })
    .then((response) => {
      repo.search[args.q] = response.data;
    });
}

export default {
  props: {
    repo: Object,
    args: Object,
  },
  title: "Search",
  check: searchString,
  setup(props) {
    return { props, main, GITHUB_ORG };
  },
};
</script>
