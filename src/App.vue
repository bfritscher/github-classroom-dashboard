<script setup>
import axios from "axios";
import { ref, computed } from "vue";
import { toRepoAPI } from "./filters.js";
import { API, GITHUB_ORG, USERNAME_BLACKLIST } from "./config.js";
import CheckCollaborators from "./checks/CheckCollaborators.vue";
import CheckCommits from "./checks/CheckCommits.vue";
import CheckBranches from "./checks/CheckBranches.vue";
import CheckGhPagesIsDist from "./checks/CheckGhPagesIsDist.vue";
import CheckMainIsSrc from "./checks/CheckMainIsSrc.vue";
import CheckRelease from "./checks/CheckRelease.vue";
import CheckGhPagesStatus from "./checks/CheckGhPagesStatus.vue";
import CheckReadme from "./checks/CheckReadme.vue";
import CheckIndex from "./checks/CheckIndex.vue";
import DisplayValue from "./checks/DisplayValue.vue";
import SearchString from "./checks/SearchString.vue";
import { main } from "./main.js";
import CheckDependencies from "./checks/CheckDependencies.vue";
import CheckViteConfig from "./checks/CheckViteConfig.vue";

// helper for access_token
const urlParams = new URLSearchParams(window.location.search);
const showAuthInfo = ref(urlParams.get("code", false));
const loginPostCurl = computed(() => {
  return `curl -X POST https://github.com/login/oauth/access_token -H 'Content-Type: application/json' -d '{"client_id": "0f49b767798fd5815a80", "client_secret": "", "code": "${showAuthInfo.value}"}'`;
});

main.assignmentsChecks = [
  CheckCollaborators,
  CheckCommits,
  {
    component: DisplayValue,
    title: "main",
    args: ["hasMain", (repo) => `${toRepoAPI(repo.name)}/tree/main`],
  },
  CheckMainIsSrc,
  {
    component: DisplayValue,
    title: "GhPages",
    args: ["hasGhPages", (repo) => `${toRepoAPI(repo.name)}/tree/gh-pages`],
  },
  CheckGhPagesStatus,
  CheckGhPagesIsDist,
  CheckViteConfig,
  CheckReadme,
  {
    component: CheckRelease,
    title: "Release 2.0.0",
    args: ["2.0.0"],
  },
  CheckIndex,
  CheckBranches,
  {
    component: DisplayValue,
    title: "tags",
    args: ["releases"],
  },
  {
    component: DisplayValue,
    title: "Style",
    args: ["style"],
  },
  CheckDependencies,
  // search is low because of rate limit add it at the end
  {
    component: SearchString,
    title: "axios",
    args: ["axios", "axios"],
  },
  {
    component: SearchString,
    title: "props",
    args: ["props", "props"],
  },
  {
    component: SearchString,
    title: "$emit",
    args: ["$emit", "emit"],
  },
  {
    component: SearchString,
    title: "console.log",
    args: ["console.log", "console"],
  },
  {
    component: SearchString,
    title: "localStorage",
    args: ["localStorage", "localStorage"],
  },
];

let interval = undefined;

function startRateInterval() {
  if (interval) return;
  const func = () => {
    const req = main.ghApi.rateLimitQueue.shift();
    if (req) {
      req.resolve(req.config);
    } else {
      clearRateInterval();
    }
  };

  func();
  interval = setInterval(func, 2100);
}

function clearRateInterval() {
  if (interval) clearInterval(interval);
  interval = undefined;
}

axios.interceptors.request.use((config) => {
  if (main.ghApi.access_token) {
    config.headers.authorization = "token " + main.ghApi.access_token;
  }
  if (config.url.includes("search/code")) {
    const promise = new Promise((resolve) => {
      main.ghApi.rateLimitQueue.push({
        config,
        resolve,
      });
      startRateInterval();
    });

    return promise;
  }

  return config;
});

axios.interceptors.response.use((response) => {
  // Do something with response data
  if (response.headers) {
    main.ghApi.rateLimit.remaining = parseInt(
      response.headers["x-ratelimit-remaining"],
      10
    );
    main.ghApi.rateLimit.limit = parseInt(
      response.headers["x-ratelimit-limit"],
      10
    );
    main.ghApi.rateLimit.reset = parseInt(
      response.headers["x-ratelimit-reset"],
      10
    );
  }
  return response;
});

function saveProjectPrefix() {
  localStorage.setItem("classroomProjectPrefix", main.classroomProjectPrefix);
}

function clear() {
  main.assignments = {};
  main.evals = [];
  main.evalsDone = [];
}

function refresh() {
  if (!main.ghApi.access_token) {
    const access_token = window.prompt("access_token");
    if (!access_token) {
      return;
    }
    main.ghApi.access_token = access_token;
    localStorage.setItem("access_token", main.ghApi.access_token);
  }

  function getRepos(page) {
    axios
      .get(`${API}orgs/${GITHUB_ORG}/repos?per_page=100&page=${page}`)
      .then((response) => {
        response.data
          .filter((repo) => {
            return (
              !USERNAME_BLACKLIST.some((name) => repo.name.includes(name)) &&
              repo.name.startsWith(main.classroomProjectPrefix)
            );
          })
          .forEach((repo) => {
            let r = { name: repo.name };
            if (
              Object.prototype.hasOwnProperty.call(main.assignments, repo.name)
            ) {
              r = main.assignments[repo.name];
            } else {
              main.assignments[repo.name] = r;
            }
            refreshAssignment(r);
          });
        if (response.headers.link) {
          const match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
          if (match[2] === "next") {
            getRepos(match[1]);
          }
        }
      });
  }
  getRepos(1);
}

async function refreshAssignment(repo) {
  repo.errors = new WeakMap();
  repo.running = new WeakMap();
  for (const checkComponent of main.assignmentsChecks) {
    await refreshCheckComponent(repo, checkComponent);
  }
  localStorage.setItem("assignments", JSON.stringify(main.assignments));
}
main.refreshAssignment = refreshAssignment;

async function refreshCheckComponent(repo, checkComponent) {
  if (!repo.errors || repo.errors.constructor.name !== "WeakMap") {
    repo.errors = new WeakMap();
  }
  if (!repo.running || repo.running.constructor.name !== "WeakMap") {
    repo.running = new WeakMap();
  }
  repo.running.set(checkComponent, true);
  repo.errors.delete(checkComponent);
  try {
    if (checkComponent.component) {
      await checkComponent.component.check(repo, ...checkComponent.args);
    } else {
      await checkComponent.check(repo);
    }
  } catch (e) {
    repo.errors.set(checkComponent, e);
  } finally {
    repo.running.set(checkComponent, false);
  }
}

main.refreshCheckComponent = refreshCheckComponent;

// UI states
const debug = ref(true);
</script>

<template>
  <header>
    <h1>Github Classroom Dashboard</h1>
    <nav>
      <router-link to="/">Checks</router-link>
      <router-link to="/preview">Preview</router-link>
      <router-link to="/evals">Uploads</router-link>
    </nav>
  </header>

  <div v-if="showAuthInfo">
    <textarea :model-value="loginPostCurl"></textarea>
  </div>
  <main>
    <p>
      {{ main.ghApi.rateLimit.remaining }} /
      {{ main.ghApi.rateLimit.limit }} reset in
      {{ main.ghApi.rateLimit.resetCoutdown() }} min
      {{ main.ghApi.rateLimitQueue.length }} in queue
    </p>
    <a
      href="https://github.com/login/oauth/authorize?client_id=0f49b767798fd5815a80&scope=read:org,repo&state=test"
      >login</a
    >
    <button @click="refresh()">refresh data</button>
    <label><input type="checkbox" v-model="debug" /> debug</label>
    <label
      >Feedback:
      <input
        placeholder="prefix"
        type="text"
        @change="saveProjectPrefix()"
        v-model="main.classroomProjectPrefix"
    /></label>
    <button @click="clear()">clear</button>
    <router-view></router-view>
  </main>
</template>

<style>
body {
  font-family: "Roboto", sans-serif;
}

a {
  text-decoration: none;
}
</style>
