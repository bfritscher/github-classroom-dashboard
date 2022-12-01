<script setup>
import axios from "axios";
import Papa from "papaparse";
import { marked } from "marked";
import { ref, computed, reactive } from "vue";
import { b64DecodeUnicode, repoToGhPagesUrl, filterBots } from "./filters.js";
import { API, GITHUB_ORG } from "./config.js";

// helper for access_token
const urlParams = new URLSearchParams(window.location.search);
const showAuthInfo = ref(urlParams.get("code", false));
const loginPostCurl = computed(() => {
  return `curl -X POST https://github.com/login/oauth/access_token -H 'Content-Type: application/json' -d '{"client_id": "0f49b767798fd5815a80", "client_secret": "", "code": "${showAuthInfo.value}"}'`;
});

const main = reactive({
  ghApi: {
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
  githubUsernameLookup: {},
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
    console.log(response.headers);
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

Papa.parse("/classroom_roster.csv", {
  download: true,
  header: true,
  complete: (results) => {
    results.data.forEach((e) => {
      main.githubUsernameLookup[e.github_username] = e.identifier;
    });
  },
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
  main.ghApi.access_token =
    localStorage.getItem("access_token") || window.prompt("access_token");
  localStorage.setItem("access_token", main.ghApi.access_token);
  axios
    .get(`${API}orgs/${GITHUB_ORG}/repos?per_page=100`) //page=2&
    .then(function (response) {
      //TODO: handle multipage
      response.data
        .filter(function (repo) {
          return !(repo.name.indexOf("bfritscher") !== -1);
        })
        .forEach(function (repo) {
          if (repo.name.indexOf(main.classroomProjectPrefix) === 0) {
            var r = { name: repo.name };
            if (main.assignments.hasOwnProperty(repo.name)) {
              r = main.assignments[repo.name];
            } else {
              main.assignments[repo.name] = r;
            }
            refreshAssignment(r);
          }
        });
    });
  // Quick workaround because we are over 100
  axios
    .get(`${API}orgs/${GITHUB_ORG}/repos?per_page=100&page=2`) //page=2&
    .then(function (response) {
      //TODO: handle multipage
      response.data
        .filter(function (repo) {
          return !(repo.name.indexOf("bfritscher") !== -1);
        })
        .forEach(function (repo) {
          if (repo.name.indexOf(main.classroomProjectPrefix) === 0) {
            var r = { name: repo.name };
            if (main.assignments.hasOwnProperty(repo.name)) {
              r = main.assignments[repo.name];
            } else {
              main.assignments[repo.name] = r;
            }
            refreshAssignment(r);
          }
        });
    });
}

function refreshAssignment(r) {
  main.ghApi.access_token = localStorage.getItem("access_token");
  getCollaborators(r)
    .then(function () {
      return checkBranches(r);
    })
    .then(function () {
      return checkGhPagesVendor(r);
    })
    .then(function () {
      return checkMasterSrc(r);
    })
    .then(function () {
      return checkReleases(r);
    })
    .then(function () {
      return checkReadme(r);
    })
    .then(function () {
      return getCommits(r);
    })
    .then(function () {
      return checkTitle(r);
    })
    .then(function () {
      return checkGHPagesStatus(r);
    })
    .then(function () {
      return searchString(r, "axios", "axios");
    })
    .then(function () {
      return searchString(r, "props", "props");
    })
    .then(function () {
      return searchString(r, "$emit", "emit");
    })
    .then(function () {
      return searchString(r, "console.log", "console");
    })
    .then(function () {
      return searchString(r, "localStorage", "localStorage");
    })
    .then(function () {
      localStorage.setItem("assignments", JSON.stringify(main.assignments));
    });
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

function searchString(r, str, key) {
  main.ghApi.access_token = localStorage.getItem("access_token");
  if (!r.hasOwnProperty("search")) {
    r.search = {};
  }
  return axios
    .get(
      API +
        `search/code?q=${str}+in:file+extension:js+extension:vue+repo:${GITHUB_ORG}/${r.name}`
    )
    .then(
      function (response) {
        r.search[key] = response.data;
      },
      () => {}
    );
}

function githubUsernameToIdentifier(login) {
  return main.githubUsernameLookup[login];
}

main.commitCount = function (commits, u) {
  if (commits) {
    return commits.filter(function (c) {
      return (
        (c.commit.author.name === u.login || c.commit.author.name === u.name) &&
        c.commit.message.indexOf("Merge") !== 0
      );
    }).length;
  }
  return 0;
};

main.getCommiterIndex = function (name) {
  if (main.commiterIndex.indexOf(name) === -1) {
    main.commiterIndex.push(name);
  }
  return main.commiterIndex.indexOf(name);
};

function checkBranches(r) {
  r.hasMaster = false;
  r.hasMain = false;
  r.hasGhPages = false;
  return axios
    .get(API + "repos/" + GITHUB_ORG + "/" + r.name + "/branches")
    .then(
      (response) => {
        r.branches = response.data.map(function (branch) {
          if (branch.name === "gh-pages") {
            r.hasGhPages = true;
          }
          if (branch.name === "main") {
            r.hasMain = true;
          }
          if (branch.name === "master") {
            r.hasMaster = true;
          }
          return branch.name;
        });
      },
      () => {}
    );
}

function checkGhPagesVendor(r) {
  r.hasVendor = false;
  return axios
    .get(
      API +
        "repos/" +
        GITHUB_ORG +
        "/" +
        r.name +
        "/contents/assets?ref=gh-pages"
    )
    .then(
      function (response) {
        for (var i = 0; i < response.data.length; i++) {
          if (
            response.data[i].name.indexOf("index") === 0 &&
            response.data[i].name.split(".").length === 3
          ) {
            r.hasVendor = true;
            return;
          }
        }
      },
      function () {
        return;
      }
    );
}

function checkMasterSrc(r) {
  r.isMasterSrc = false;
  return axios
    .get(
      API +
        "repos/" +
        GITHUB_ORG +
        "/" +
        r.name +
        "/contents/?ref=" +
        (r.hasMain ? "main" : "master")
    )
    .then(
      function (response) {
        for (var i = 0; i < response.data.length; i++) {
          if (response.data[i].name.indexOf("package.json") === 0) {
            r.isMasterSrc = true;
            return;
          }
        }
      },
      function () {
        return;
      }
    );
}

function checkTitle(r) {
  r.title = false;
  return axios
    .get(
      API +
        "repos/" +
        GITHUB_ORG +
        "/" +
        r.name +
        "/contents/index.html?ref=gh-pages"
    )
    .then(
      function (response) {
        var regexTitle = /title>(.*?)<\/title/gm;
        var regexStyle = /style="[^w](.*?)"/gm;
        var html = b64DecodeUnicode(response.data.content);
        var match = regexTitle.exec(html);
        if (match) {
          r.title = match[1];
        }
        match = regexStyle.exec(html);
        if (match) {
          r.style = match[1];
        } else {
          r.style = "";
        }
      },
      function () {
        return;
      }
    );
}

function checkReleases(r) {
  r.hasRelease = false;
  r.releaseSha = "";
  return axios.get(API + "repos/" + GITHUB_ORG + "/" + r.name + "/tags").then(
    function (response) {
      r.releases = response.data.map(function (release) {
        if (release.name === "2.0.0") {
          r.hasRelease = true;
          r.releaseSha = release.commit.sha;
        }

        return release.name;
      });
    },
    () => {}
  );
}

function checkGHPagesStatus(r) {
  main.ghApi.access_token = localStorage.getItem("access_token");
  return axios.get(API + "repos/" + GITHUB_ORG + "/" + r.name + "/pages").then(
    function (response) {
      r.ghPagesStatus = response.data.status;
    },
    () => {}
  );
}

function enableGHPages(r) {
  main.ghApi.access_token = localStorage.getItem("access_token");
  const req = {
    method: "POST",
    url: API + "repos/" + GITHUB_ORG + "/" + r.name + "/pages",
    headers: {
      Accept: "application/vnd.github.switcheroo-preview+json",
    },
    data: {
      source: {
        branch: "gh-pages",
      },
    },
  };
  axios(req).then(function () {
    setTimeout(() => {
      checkGHPagesStatus(r);
    }, 2000);
  });
}
main.enableGHPages = enableGHPages;

function checkReadme(r) {
  r.hasReadme = false;
  return axios.get(API + "repos/" + GITHUB_ORG + "/" + r.name + "/readme").then(
    function (response) {
      r.hasReadme = response.data.name.indexOf(".md") > -1;
      r.readmeUrl = response.data.html_url;
    },
    function () {
      return;
    }
  );
}

function getCollaborators(r) {
  return axios
    .get(API + "repos/" + GITHUB_ORG + "/" + r.name + "/collaborators")
    .then(
      function (response) {
        r.users = response.data
          .filter(function (c) {
            return c.login !== "bfritscher";
          })
          .map(function (c) {
            var u = { login: c.login };
            getUser(u);
            return u;
          });
      },
      () => {}
    );
}

function getCommitsPage(r, page) {
  return axios
    .get(
      API +
        "repos/" +
        GITHUB_ORG +
        "/" +
        r.name +
        "/commits?per_page=100&page=" +
        page
    )
    .then(
      function (response) {
        r.commits = r.commits.concat(response.data);
        if (response.headers.link) {
          var match = response.headers.link.match(/page=(\d+)>; rel="(.*?)"/);
          if (match[2] === "next") {
            getCommitsPage(r, match[1]);
          }
        }
      },
      function () {
        return;
      }
    );
}

function getCommits(r) {
  r.commits = [];
  return getCommitsPage(r, 1);
}

function getUser(u) {
  //TODO lookup cache;
  return axios.get(API + "users/" + u.login).then(
    function (response) {
      u.name = response.data.name;
    },
    () => {}
  );
}

// ISSUE HANDLING
function createIssue() {
  main.ghApi.access_token = localStorage.getItem("access_token");
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
const debug = ref(false);
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
          <th v-if="debug">matricule</th>
          <th>nom</th>
          <th>main</th>
          <th>mainIsSrc</th>
          <th>gh-pages</th>
          <th v-if="debug">status</th>
          <th>webIsDist</th>
          <th>readme</th>
          <th>2.0.0</th>
          <th>title</th>
          <th v-if="debug">commits</th>
          <th v-if="debug">branches</th>
          <th v-if="debug">tags</th>
          <th v-if="debug">style</th>
          <th>bootstrap</th>
          <th>structure/code</th>
          <th>1 jquery plugin</th>
          <th>Text readme</th>
          <th v-if="debug">axios</th>
          <th v-if="debug">props</th>
          <th v-if="debug">$emit</th>
          <th v-if="debug">console.log</th>
          <th v-if="debug">localStorage</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(a, name, index) in main.assignments" :key="name">
          <td @click="refreshAssignment(a)">{{ index + 1 }}</td>
          <td>{{ name }}</td>
          <td v-if="debug">
            <div class="student" v-for="u in a.users" :key="u.login">
              {{ githubUsernameToIdentifier(u.login) }}
            </div>
          </td>
          <td>
            <span
              class="student"
              v-for="u in filterBots(a.users || [])"
              :key="u.login"
              >{{ u.name }}
              <span v-if="!u.name || debug">({{ u.login }})</span>
              <b>[{{ main.commitCount(a.commits, u) }}]</b>
            </span>
          </td>

          <td
            :class="{
              correct: a.hasMaster || a.hasMain,
              wrong: !(a.hasMaster || a.hasMain),
            }"
          >
            <a
              target="_blank"
              :href="`https://github.com/heg-web/${a.name}/tree/master`"
              >{{ a.hasMaster || a.hasMain }}</a
            >
          </td>
          <td :class="{ correct: a.isMasterSrc, wrong: !a.isMasterSrc }">
            <a
              target="_blank"
              :href="`https://github.com/heg-web/${a.name}/tree/master`"
              >{{ a.isMasterSrc }}</a
            >
          </td>
          <td :class="{ correct: a.hasGhPages, wrong: !a.hasGhPages }">
            <a
              target="_blank"
              :href="`https://github.com/heg-web/${a.name}/tree/gh-pages`"
              >{{ a.hasGhPages }}</a
            >
          </td>
          <td
            v-if="debug"
            :class="{
              correct: a.ghPagesStatus == 'built',
              wrong: !a.ghPagesStatus || a.ghPagesStatus != 'built',
            }"
          >
            <button
              v-if="!a.ghPagesStatus && a.hasGhPages"
              @click="main.enableGHPages(a)"
            >
              enable</button
            >{{ a.ghPagesStatus }}
          </td>

          <td :class="{ correct: a.hasVendor, wrong: !a.hasVendor }">
            <a target="_blank" :href="`https://heg-web.github.io/${a.name}`">{{
              a.hasVendor
            }}</a>
          </td>
          <td :class="{ correct: a.hasReadme, wrong: !a.hasReadme }">
            <a target="_blank" :href="a.readmeUrl">{{ a.hasReadme }}</a>
          </td>
          <td :class="{ correct: a.hasRelease, wrong: !a.hasRelease }">
            <a
              target="_blank"
              :href="`https://github.com/heg-web/${a.name}/tree/${a.releaseSha}`"
              >{{ a.hasRelease }}</a
            >
          </td>
          <td>
            <a
              target="_blank"
              :href="`https://github.com/heg-web/${a.name}/blob/${a.releaseSha}main/index.html`"
              >{{ a.title }}</a
            >
          </td>
          <td
            v-if="debug"
            @click="
              main.commiterIndex = [];
              main.commits = a.commits;
            "
          >
            {{ a.commits.length }}
          </td>
          <td v-if="debug">{{ a.branches }}</td>
          <td v-if="debug">{{ a.releases }}</td>
          <td v-if="debug">{{ a.style }}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td v-if="debug">
            <div v-if="a.search.axios">
              {{ a.search.axios.total_count }}
              <ul>
                <li v-for="(e, index) in a.search.axios.items" :key="index">
                  <a :href="e.html_url">{{ e.path }}</a>
                </li>
              </ul>
            </div>
          </td>
          <td v-if="debug">
            <div v-if="a.search.props">
              {{ a.search.props.total_count }}
              <ul>
                <li v-for="(e, index) in a.search.props.items" :key="index">
                  <a :href="e.html_url">{{ e.path }}</a>
                </li>
              </ul>
            </div>
          </td>
          <td v-if="debug">
            <div v-if="a.search.emit">
              {{ a.search.emit.total_count }}
              <ul>
                <li v-for="(e, index) in a.search.emit.items" :key="index">
                  <a :href="e.html_url">{{ e.path }}</a>
                </li>
              </ul>
            </div>
          </td>
          <td v-if="debug">
            <div v-if="a.search.console">
              {{ a.search.console.total_count }}
              <ul>
                <li v-for="(e, index) in a.search.console.items" :key="index">
                  <a :href="e.html_url">{{ e.path }}</a>
                </li>
              </ul>
            </div>
          </td>
          <td v-if="debug">
            <div v-if="a.search.localStorage">
              {{ a.search.localStorage.total_count }}
              <ul>
                <li
                  v-for="(e, index) in a.search.localStorage.items"
                  :key="index"
                >
                  <a :href="e.html_url">{{ e.path }}</a>
                </li>
              </ul>
            </div>
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

.student img {
  width: 80px;
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
