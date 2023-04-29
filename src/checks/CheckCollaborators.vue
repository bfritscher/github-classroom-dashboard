<template>
  <div v-for="u in props.repo.users" :key="u.login" class="text-nowrap">
    <img
      v-if="main.showPic"
      class="profile"
      :src="`/pics/${githubUsernameLookupPics[u.login].matricule_isa}.jpg`"
    />
    {{ githubUsernameLookup[u.login] || u.login }}
  </div>
</template>
<script>
import axios from "axios";
import { USERNAME_BLACKLIST } from "../config.js";
import { toRepoAPI } from "../filters.js";
import { main } from "../main.js";
import {
  addNameToUserFromGithub,
  githubUsernameLookup,
  githubUsernameLookupPics,
} from "../api.js";
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
  total(repos) {
    return repos.reduce((acc, repo) => acc + repo.users?.length, 0);
  },
  setup(props) {
    return { main, props, githubUsernameLookup, githubUsernameLookupPics };
  },
};
</script>
<style scoped>
.profile {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
  vertical-align: middle;
}
.profile:hover {
  width: 272px;
  height: 340px;
  border-radius: 0;
}
</style>
