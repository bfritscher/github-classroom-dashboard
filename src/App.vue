<script setup>
import axios from "axios";
import Papa from "papaparse";
import { marked } from "marked";
import { ref, computed, reactive } from "vue";
import { repoToGhPagesUrl, toRepoAPI } from "./filters.js";
import { API, GITHUB_ORG, USERNAME_BLACKLIST } from "./config.js";
import { githubUsernameLookup } from "./api.js";
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

// helper for access_token
const urlParams = new URLSearchParams(window.location.search);
const showAuthInfo = ref(urlParams.get("code", false));
const loginPostCurl = computed(() => {
  return `curl -X POST https://github.com/login/oauth/access_token -H 'Content-Type: application/json' -d '{"client_id": "0f49b767798fd5815a80", "client_secret": "", "code": "${showAuthInfo.value}"}'`;
});

const assignmentsChecks = [
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

const main = reactive({
  ghApi: {
    access_token: localStorage.getItem("access_token"),
    rateLimit: {
      remaining: 0,
      limit: 0,
      reset: 0,
      resetCoutdown() {
        return Math.round(
          (main.ghApi.rateLimit.reset * 1000 - new Date().getTime()) /
            (60 * 1000)
        );
      },
    },
  },
  evals: [],
  evalsDone: [],
});

axios.interceptors.request.use((config) => {
  if (main.ghApi.access_token) {
    config.headers.authorization = "token " + main.ghApi.access_token;
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

main.assignments = JSON.parse(localStorage.getItem("assignments") || "{}");
main.classroomProjectPrefix = localStorage.getItem("classroomProjectPrefix");

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
      .then(function (response) {
        response.data
          .filter((repo) => {
            return !USERNAME_BLACKLIST.some((name) =>
              repo.name.startsWith(name)
            );
          })
          .forEach((repo) => {
            if (repo.name.indexOf(main.classroomProjectPrefix) === 0) {
              let r = { name: repo.name };
              if (
                Object.prototype.hasOwnProperty.call(
                  main.assignments,
                  repo.name
                )
              ) {
                r = main.assignments[repo.name];
              } else {
                main.assignments[repo.name] = r;
              }
              refreshAssignment(r);
            }
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
  for (const checkComponent of assignmentsChecks) {
    try {
      if (checkComponent.component) {
        await checkComponent.component.check(repo, ...checkComponent.args);
      } else {
        await checkComponent.check(repo);
      }
    } catch (e) {
      // TODO handle error
      console.error(e);
    }
  }
  localStorage.setItem("assignments", JSON.stringify(main.assignments));
}

function getUrls() {
  return (
    "data:text/plain;charset=utf-8," +
    encodeURIComponent(
      Object.keys(main.assignments).reduce(function (list, key) {
        return list + repoToGhPagesUrl(main.assignments[key].name) + "\n";
      }, "")
    )
  );
}

main.getCommiterIndex = function (name) {
  if (main.commiterIndex.indexOf(name) === -1) {
    main.commiterIndex.push(name);
  }
  return main.commiterIndex.indexOf(name);
};

// ISSUE HANDLING
function createIssue() {
  const evaluation = main.evals.pop();
  if (evaluation) {
    const issue = {
      title: `Evaluation ${evaluation.repo}`,
      body: evaluation.md,
    };
    axios
      .post(
        API + "repos/" + GITHUB_ORG + "/" + evaluation.repo + "/issues",
        issue
      )
      .then(function (response) {
        main.evalsDone.push({
          repo: evaluation.repo,
          html_url: response.data.html_url,
        });
      })
      .catch((e) => {
        console.log(e);
      });
    setTimeout(createIssue, 1000);
  }
}

function toMD(fields, data) {
  return fields.reduce((md, field) => {
    if (!isNaN(data[field]) && isNaN(field)) {
      if (field.startsWith("Note")) {
        md += `|**${field}** | **${data[field]}**|\n`;
      } else {
        md += `|${field} | ${data[field]}|\n`;
      }
    }
    if (field === "Commentaires") {
      md += `\n\n### ${field}\n${data[field]}\n`;
    }
    return md;
  }, `## Evaluation ${data.repo}\n\n| Critères | Points |\n|---|---:|\n`);
}

function parseCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const fields = results.meta.fields.filter((f) => f && !f.startsWith("_"));
      const evals = [];
      results.data.forEach((row) => {
        const md = toMD(fields, row);
        evals.push({
          repo: row.repo,
          md: md,
          preview: marked(md),
        });
      });
      main.evals = evals;
    },
  });
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  parseCSV(file);
}

// UI states
const debug = ref(true);
const displayMobilePreview = ref(false);
</script>

<template>
  <header></header>

  <div v-if="showAuthInfo">
    <textarea :model-value="loginPostCurl"></textarea>
  </div>
  <main>
    <h1>Github Classroom Dashboard</h1>
    <p>
      {{ main.ghApi.rateLimit.remaining }} /
      {{ main.ghApi.rateLimit.limit }} reset in
      {{ main.ghApi.rateLimit.resetCoutdown() }} min
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

    <input type="file" @change="handleFileSelect" />

    <div v-if="main.evals.length > 0 || main.evalsDone.length > 0">
      <h2>Evaluations {{ main.evals.length }}</h2>
      <div
        class="eval"
        v-for="ev in main.evals"
        v-html="ev.preview"
        :key="ev.repo"
      ></div>
      <button @click="createIssue()">Create Issues on GitHUB</button>
      <p>Done: {{ main.evalsDone.length }}</p>
      <ul>
        <li v-for="done in main.evalsDone" :key="done.repo">
          <a :href="done.html_url">{{ done.repo }}</a>
        </li>
      </ul>
    </div>

    <h2>Checks</h2>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Project</th>
          <th v-for="(check, index) in assignmentsChecks" :key="index">
            {{ check.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(repo, name, index) in main.assignments" :key="name">
          <td @click="refreshAssignment(repo)">{{ index + 1 }}</td>
          <td>{{ name }}</td>
          <td
            v-for="(checkComponent, index) in assignmentsChecks"
            :key="index"
            :class="
              (checkComponent.component
                ? checkComponent.component
                : checkComponent
              ).isCorrect
                ? (checkComponent.component
                    ? checkComponent.component
                    : checkComponent
                  ).isCorrect(repo, checkComponent.args)
                  ? 'correct'
                  : (checkComponent.component
                      ? checkComponent.component
                      : checkComponent
                    ).isCorrect(repo, checkComponent.args) === undefined
                  ? ''
                  : 'wrong'
                : ''
            "
          >
            <component
              :is="
                checkComponent.component
                  ? checkComponent.component
                  : checkComponent
              "
              :repo="repo"
              :args="checkComponent.args"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div>
      <div
        v-for="c in main.commits"
        class="commiter{{main.getCommiterIndex(c.commit.author.name)}}"
        :key="c.sha"
      >
        <i>{{ c.commit.author.name }}</i>
        {{ c.commit.author.date }}
        <a
          target="_blank"
          :href="c.html_url"
          :class="{ merge: c.commit.message.indexOf('Merge') == 0 }"
          >{{ c.commit.message }}</a
        >
      </div>
    </div>
    <a :href="getUrls()" download="urls.txt">download urls.txt</a>

    <!--
    <h2>Preview</h2>
    <input type="checkbox" v-model="displayMobilePreview" /> Mobile
    <div id="preview" :class="{ noMobile: !displayMobilePreview }">
      <div
        class="preview"
        :class="{ 'preview-zoom': main.zoom == a }"
        v-for="a in main.assignments"
        :key="a.name"
      >
        <div>
          <a target="_blank" :href="`https://heg-web.github.io/${a.name}`"
            >{{ a.name }}
            <span :class="{ correct: a.hasVendor, wrong: !a.hasVendor }">{{
              a.hasVendor
            }}</span></a
          >
          <span class="zoom-toggle" v-if="main.zoom != a" @click="main.zoom = a"
            >show</span
          >
          <span
            class="zoom-toggle"
            v-if="main.zoom == a"
            @click="main.zoom = null"
            >close</span
          >
        </div>
        <div class="preview-iframes">
          <div v-if="displayMobilePreview">
            <iframe
              style="
                position: absolute;
                width: 640px;
                height: 3000px;
                transform: scale3d(0.2, 0.2, 1) translate3d(-1300px, -6000px, 0);
              "
              :src="repoToGhPagesUrl(a.name)"
            ></iframe>
          </div>
          <div v-if="displayMobilePreview">
            <iframe
              style="
                position: absolute;
                width: 1024px;
                height: 3000px;
                transform: scale3d(0.2, 0.2, 1) translate3d(-2040px, -6000px, 0);
              "
              :src="repoToGhPagesUrl(a.name)"
            ></iframe>
          </div>
          <div v-if="displayMobilePreview">
            <iframe
              style="
                position: absolute;
                width: 1600px;
                height: 3000px;
                transform: scale3d(0.2, 0.2, 1) translate3d(-3200px, -6000px, 0);
              "
              :src="repoToGhPagesUrl(a.name)"
            ></iframe>
          </div>
          <div v-if="!displayMobilePreview">
            <iframe
              style="
                position: absolute;
                width: 1600px;
                height: 3000px;
                transform: scale3d(0.3, 0.3, 1) translate3d(-1850px, -3500px, 0);
              "
              :src="repoToGhPagesUrl(a.name)"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
    -->
  </main>
</template>

<style>
body {
  font-family: "Roboto", sans-serif;
}

a {
  text-decoration: none;
}

.correct,
.correct a {
  color: green;
}

.wrong,
.wrong a {
  color: red;
}

table {
  border-collapse: collapse;
}

tbody td {
  border: 1px solid #333;
  padding: 2px;
}

#preview {
  display: flex;
  flex-wrap: wrap;
}

.preview {
  width: 700px;
  height: 400px;
  overflow: hidden;
}

.zoom-toggle {
  float: right;
  padding-right: 10px;
  cursor: pointer;
}

.preview-zoom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.preview-zoom .preview-iframes > div {
  height: 100vh;
}

.preview-zoom .preview-iframes iframe {
  height: 100% !important;
  width: 100% !important;
  transform: none !important;
}

.preview a {
  font-size: 12pt;
  color: black;
  font-weight: bold;
  padding: 4px 0;
}

.preview img {
  vertical-align: top;
}

.preview img:nth-child(1),
.preview .preview-iframes > div:nth-child(1) {
  width: 20%;
}

.preview img:nth-child(2),
.preview .preview-iframes > div:nth-child(2) {
  width: 32%;
}

.preview img:nth-child(3),
.preview .preview-iframes > div:nth-child(3) {
  width: 46%;
}

.preview-iframes > div {
  position: relative;
  height: 400px;
  overflow: auto;
  float: left;
}

.noMobile .preview-iframes > div {
  width: 100% !important;
}

.noMobile .preview {
  width: 500px;
  height: 400px;
}

.commiter0 {
  background-color: #29b6f6;
}

.commiter1 {
  background-color: #b39ddb;
}

.merge {
  background-color: orange;
}

.eval {
  border: 1px solid red;
  margin: 20px;
}
</style>
