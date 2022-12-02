<template>
  <div @click="showCommits()">
    <span v-for="u in props.repo.users" :key="u.login"
      >{{ u.name }}
      <span v-if="!u.name">({{ u.login }})</span>
      <b>[{{ commitCount(props.repo.commits, u) }}]</b>
    </span>
  </div>
</template>
<script>
import axios from "axios";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";

function getCommitsPage(repo, page) {
  return axios
    .get(`${toRepoAPI(repo.name)}/commits?per_page=100&page=${page}`)
    .then((response) => {
      repo.commits = repo.commits.concat(response.data);
      if (response.headers.link) {
        const match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
        if (match[2] === "next") {
          getCommitsPage(repo, match[1]);
        }
      }
    });
}

function getCommits(repo) {
  repo.commits = [];
  return getCommitsPage(repo, 1);
}

function commitCount(commits, u) {
  if (commits) {
    return commits.filter((c) => {
      return (
        (c.commit.author.name === u.login || c.commit.author.name === u.name) &&
        c.commit.message.indexOf("Merge") !== 0
      );
    }).length;
  }
  return 0;
}

export default {
  props: {
    repo: Object,
  },
  title: "Commits",
  check: getCommits,
  setup(props) {
    return {
      props,
      commitCount,
      main,
      showCommits() {
        main.commiterIndex = [];
        main.commits = props.repo.commits;
      },
    };
  },
};
</script>
