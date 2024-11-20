<template>
  <div>
  </div>
</template>
<script>
import axios from "axios";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";

async function getIssuesPage(repo, page) {
  return await axios
    .get(`${toRepoAPI(repo.name)}/actions/artifacts?per_page=100&page=${page}`)
    .then(async (response) => {
      for (const a of response.data.artifacts) {
        await axios
          .delete(`${toRepoAPI(repo.name)}/actions/artifacts/${a.id}`)
          .then(async (response) => {
            console.log(response.data);
          });
      }
      if (response.headers.link) {
        const match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
        if (match[2] === "next") {
          await getIssuesPage(repo, match[1]);
        }
      }
    });
}

function getIssues(repo) {
  return getIssuesPage(repo, 1);
}

export default {
  props: {
    repo: Object,
  },
  title: "Artifacts",
  check: getIssues,
  setup(props) {
    return {
      props,
      main,
    };
  },
};
</script>
