<template>
  <div v-for="u in props.repo.users" :key="u.login">
    {{ githubUsernameLookup[u.login] || u.login }}
  </div>
</template>
<script>
import axios from "axios";
import { USERNAME_BLACKLIST } from "../config.js";
import { toRepoAPI } from "../filters.js";
import { addNameToUserFromGithub, githubUsernameLookup } from "../api.js";
export default {
  props: {
    repo: Object,
  },
  title: "Name",
  check: async (repo) => {
    repo.users = [];
    const response = await axios.get(`${toRepoAPI(repo.name)}/collaborators`);
    repo.users = response.data
      .filter((c) => !USERNAME_BLACKLIST.includes(c.login))
      .map((c) => {
        const u = { login: c.login };
        addNameToUserFromGithub(u);
        return u;
      });
  },
  setup(props) {
    return { props, githubUsernameLookup };
  },
};
</script>
