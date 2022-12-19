<template>
  <div @click="showCommits()">
    <div v-for="u in props.repo.users" :key="u.login" class="text-nowrap">
      {{ u.name }}
      <span v-if="!u.name">({{ u.login }})</span>
      <b>[{{ commitCount(props.repo.commits, u) }}]</b>
    </div>
    <div v-if="main.showDetails">
      github-classroom[bot]
      <b
        >[{{
          commitCount(props.repo.commits, { name: "github-classroom[bot]" })
        }}]</b
      >
    </div>
    <div v-if="main.showDetails">
      Merge <b>[{{ commitCountMerge(props.repo.commits) }}]</b>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";

async function getCommitsPage(repo, page) {
  return await axios
    .get(`${toRepoAPI(repo.name)}/commits?per_page=100&page=${page}`)
    .then(async (response) => {
      repo.commits = repo.commits.concat(response.data);
      if (response.headers.link) {
        const match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
        if (match[2] === "next") {
          await getCommitsPage(repo, match[1]);
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
        ((c.author && c.author.login === u.login) ||
          c.commit.author.name === u.name) &&
        c.commit.message.indexOf("Merge") !== 0
      );
    }).length;
  }
  return 0;
}

function commitCountMerge(commits) {
  if (commits) {
    return commits.filter((c) => {
      return c.commit.message.indexOf("Merge") == 0;
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
  total(repos) {
    const stats = repos.reduce(
      (stats, repo) => {
        const commitsCount = repo.commits.filter((c) => {
          return (
            c.commit.message.indexOf("Merge") !== 0 &&
            c.commit.author.name !== "github-classroom[bot]"
          );
        }).length;
        stats.min = Math.min(stats.min, commitsCount);
        stats.max = Math.max(stats.max, commitsCount);
        stats.total += commitsCount;
        stats.count++;
        return stats;
      },
      {
        min: 0,
        max: 0,
        total: 0,
        count: 0,
      }
    );
    return `${stats.min} - ${stats.max} (${Math.round(
      stats.total / stats.count
    )})`;
  },
  setup(props) {
    return {
      props,
      commitCount,
      commitCountMerge,
      main,
      showCommits() {
        main.commiterIndex = [];
        main.commits = props.repo.commits;
      },
    };
  },
};
</script>
