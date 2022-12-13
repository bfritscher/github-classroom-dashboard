<script setup>
import { computed, reactive } from "vue";
import axios from "axios";
import { repoToGhPagesUrl, toRepo } from "../filters.js";
import { main } from "../main.js";
import { API, GITHUB_ORG, USERNAME_BLACKLIST } from "../config.js";
import CheckCollaborators from "../checks/CheckCollaborators.vue";
import CheckCommits from "../checks/CheckCommits.vue";
import CheckBranches from "../checks/CheckBranches.vue";
import CheckGhPagesIsDist from "../checks/CheckGhPagesIsDist.vue";
import CheckRelease from "../checks/CheckRelease.vue";
import CheckGhPagesStatus from "../checks/CheckGhPagesStatus.vue";
import CheckReadme from "../checks/CheckReadme.vue";
import CheckIndex from "../checks/CheckIndex.vue";
import DisplayValue from "../checks/DisplayValue.vue";
import SearchString from "../checks/SearchString.vue";
import CheckDependencies from "../checks/CheckDependencies.vue";
import CheckViteConfig from "../checks/CheckViteConfig.vue";
import CheckEslint from "../checks/CheckEslint.vue";

const assignmentsChecks = [
  CheckCollaborators,
  CheckCommits,
  {
    component: DisplayValue,
    title: "Main",
    args: ["hasMain", (repo) => `${toRepo(repo.name)}/tree/main`],
  },
  {
    component: DisplayValue,
    title: "GhPages",
    args: ["hasGhPages", (repo) => `${toRepo(repo.name)}/tree/gh-pages`],
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
    title: "Tags",
    args: ["releases"],
  },
  {
    component: DisplayValue,
    title: "Style",
    args: ["style"],
  },
  CheckDependencies,
  CheckEslint,
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
    title: "$root",
    args: ["$root", "root"],
  },
  {
    component: SearchString,
    title: "JSON.parse",
    args: ["JSON.parse", "jsonP"],
  },
  {
    component: SearchString,
    title: "JSON.stringify",
    args: ["JSON.stringify", "jsonS"],
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

const assignmentsChecksFiltered = computed(() => {
  return assignmentsChecks.filter((c) => {
    if (c.component === SearchString) {
      return main.showSearch;
    }
    return true;
  });
});

const sortedAssignments = computed(() => {
  return Object.keys(main.assignments).sort((a, b) => {
    const repoA = main.assignments[a];
    const repoB = main.assignments[b];
    return repoA.name.localeCompare(repoB.name);
  });
});

function getUrls() {
  return (
    "data:text/plain;charset=utf-8," +
    encodeURIComponent(
      Object.keys(main.assignments).reduce((list, key) => {
        return list + repoToGhPagesUrl(main.assignments[key].name) + "\n";
      }, "")
    )
  );
}

function saveProjectPrefix() {
  localStorage.setItem("classroomProjectPrefix", main.classroomProjectPrefix);
}

function clear() {
  main.assignments = {};
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

  async function getRepos(page) {
    await axios
      .get(`${API}orgs/${GITHUB_ORG}/repos?per_page=100&page=${page}`)
      .then(async (response) => {
        response.data
          .filter((repo) => {
            return (
              (!USERNAME_BLACKLIST.some((name) => repo.name.includes(name)) &&
                repo.name.startsWith(main.classroomProjectPrefix)) ||
              repo.name === main.classroomProjectPrefix
            );
          })
          .forEach((repo) => {
            let r = reactive({ name: repo.name });
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
            await getRepos(match[1]);
          }
        }
      });
  }
  getRepos(1);
}
async function refreshAssignment(repo) {
  repo.errors = new WeakMap();
  repo.running = new WeakMap();
  for (const checkComponent of assignmentsChecksFiltered.value) {
    await refreshCheckComponent(repo, checkComponent);
  }
}

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
    localStorage.setItem("assignments", JSON.stringify(main.assignments));
  }
}

function refreshCheckRow(checkComponent) {
  for (const repo of Object.values(main.assignments)) {
    refreshCheckComponent(repo, checkComponent);
  }
}

function getCommiterIndex(name) {
  if (main.commiterIndex.indexOf(name) === -1) {
    main.commiterIndex.push(name);
  }
  return main.commiterIndex.indexOf(name);
}
</script>

<template>
  <div class="submenu">
    <label
      >Prefix:
      <input
        style="width: 60px"
        type="text"
        placeholder="prefix"
        @change="saveProjectPrefix()"
        v-model="main.classroomProjectPrefix"
    /></label>
    <button @click="refresh()">refresh data</button>
    <span
      >{{ main.ghApi.rateLimit.remaining }} /
      {{ main.ghApi.rateLimit.limit }} reset in
      {{ main.ghApi.rateLimit.resetCoutdown() }} min
      {{ main.ghApi.rateLimitQueue.length }} in queue
    </span>

    <label><input type="checkbox" v-model="main.showDetails" /> Details</label>
    <label><input type="checkbox" v-model="main.showSearch" /> Search</label>
    <label><input type="checkbox" v-model="main.showPic" /> Pic</label>
    <span class="spacer"></span>
    <a :href="getUrls()" download="urls.txt">download urls.txt</a>
    <button @click="clear()">clear</button>
  </div>

  <h2>Checks</h2>
  <div class="overflow">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Project</th>
          <th
            v-for="(check, index) in assignmentsChecksFiltered"
            :key="index"
            @click="refreshCheckRow(check)"
          >
            {{ check.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(name, index) in sortedAssignments" :key="name">
          <td @click="refreshAssignment(main.assignments[name])">
            {{ index + 1 }}
          </td>
          <td>{{ name }}</td>
          <td
            v-for="(checkComponent, index) in assignmentsChecksFiltered"
            :key="index"
            :class="`${
              (checkComponent.component
                ? checkComponent.component
                : checkComponent
              ).isCorrect
                ? (checkComponent.component
                    ? checkComponent.component
                    : checkComponent
                  ).isCorrect(main.assignments[name], checkComponent.args)
                  ? 'correct'
                  : (checkComponent.component
                      ? checkComponent.component
                      : checkComponent
                    ).isCorrect(main.assignments[name], checkComponent.args) ===
                    undefined
                  ? ''
                  : 'wrong'
                : ''
            } ${
              main.assignments[name].errors &&
              main.assignments[name].errors.constructor.name === 'WeakMap' &&
              main.assignments[name].errors.has(checkComponent)
                ? 'error'
                : ''
            }

                      ${
                        main.assignments[name].running &&
                        main.assignments[name].running.constructor.name ===
                          'WeakMap' &&
                        main.assignments[name].running.has(checkComponent)
                          ? main.assignments[name].running.get(checkComponent)
                            ? 'running'
                            : 'done'
                          : ''
                      }`"
            @dblclick="
              refreshCheckComponent(main.assignments[name], checkComponent)
            "
          >
            <component
              v-if="checkComponent.args"
              :is="
                checkComponent.component
                  ? checkComponent.component
                  : checkComponent
              "
              :repo="main.assignments[name]"
              :args="checkComponent.args"
            />
            <component
              v-else
              :is="
                checkComponent.component
                  ? checkComponent.component
                  : checkComponent
              "
              :repo="main.assignments[name]"
            />
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th></th>
          <th
            v-for="(check, index) in assignmentsChecksFiltered"
            :key="index"
            @click="refreshCheckRow(check)"
          >
            <span v-if="(check.component || check).total">
              {{
                (check.component || check).total(
                  Object.values(main.assignments),
                  check.args
                )
              }}</span
            >
          </th>
        </tr>
      </tfoot>
    </table>
  </div>

  <div>
    <div
      v-for="c in main.commits.filter(
        (c) => c.commit.author.name !== 'github-classroom[bot]'
      )"
      :class="`commit commiter${getCommiterIndex(c.commit.author.name)}`"
      :key="c.sha"
    >
      <i>{{ c.commit.author.name }}</i>
      {{ c.commit.author.date.replace("T", " ").slice(0, 16) }}
      <a
        target="_blank"
        :href="c.html_url"
        :class="{ merge: c.commit.message.indexOf('Merge') == 0 }"
        >{{ c.commit.message }}</a
      >
    </div>
  </div>
</template>

<style>
.correct,
.correct a {
  color: rgb(52, 158, 52);
}

.wrong,
.wrong a {
  color: rgb(250, 133, 133);
}

.warn,
.warn a {
  color: rgb(244, 174, 95);
}

.error {
  background-color: rgba(247, 196, 196, 0.2);
}

.running {
  background-color: #ffffcc;
}

table {
  border-collapse: collapse;
}

tbody tr:hover {
  background-color: #ffffcc;
}

th {
  color: #509ee3;
  border-top: 1px solid #eeecec;
  padding: 0 8px;
  font-size: 13px;
}

tbody td {
  border: 1px solid #eeecec;
  padding: 0 8px;
}
.commit {
  padding: 2px;
}
.commiter0 {
  background-color: #b2e7ff;
}

.commiter1 {
  background-color: #d1c8e3;
}

.merge {
  background-color: rgb(237, 201, 135);
}
</style>
