<template>
  <div>{{ props.repo.issues?.open }} | {{ props.repo.issues?.closed }}</div>
</template>
<script>
import axios from "axios";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";

async function getIssuesPage(repo, page) {
  return await axios
    .get(`${toRepoAPI(repo.name)}/issues?state=all&per_page=100&page=${page}`)
    .then(async (response) => {
      response.data.forEach((issue) => {
        if (issue.pull_request) {
          return;
        }
        if (!Object.hasOwnProperty.call(repo.issues, issue.state)) {
          repo.issues[issue.state] = 0;
        }
        repo.issues[issue.state]++;
        console.log(issue.state);
        console.log(issue);
      });
      if (response.headers.link) {
        const match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
        if (match[2] === "next") {
          await getIssuesPage(repo, match[1]);
        }
      }
    });
}

function getIssues(repo) {
  repo.issues = {
    open: 0,
    closed: 0,
  };
  return getIssuesPage(repo, 1);
}

export default {
  props: {
    repo: Object,
  },
  title: "Issues",
  check: getIssues,
  total(repos) {
    const stats = repos.reduce(
      (stats, repo) => {
        if (!repo.commits) {
          return stats;
        }
        const issuesCount = repo.issues?.open + repo.issues?.closed || 0;
        stats.min = Math.min(stats.min, issuesCount);
        stats.max = Math.max(stats.max, issuesCount);
        stats.total += issuesCount;
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
      main,
    };
  },
};
</script>
