<script setup>
import { computed, reactive, ref } from "vue";
import axios from "axios";
import { repoToGhPagesUrl, toRepo } from "../filters.js";
import { main } from "../main.js";
import { API, GITHUB_ORG, USERNAME_BLACKLIST } from "../config.js";
import { githubUsernameLookup } from "../api.js";
import { store, updateCurrentAssignment } from "../appwrite.js";
import CheckCollaborators from "../checks/CheckCollaborators.vue";
import CheckCommits from "../checks/CheckCommits.vue";
import CheckBranches from "../checks/CheckBranches.vue";
import CheckGhPagesIsDist from "../checks/CheckGhPagesIsDist.vue";
import CheckRelease from "../checks/CheckRelease.vue";
import CheckGhPagesStatus from "../checks/CheckGhPagesStatus.vue";
import CheckReadme from "../checks/CheckReadme.vue";
import CheckReadmeMembers from "../checks/CheckReadmeMembers.vue";
import CheckReadmeImages from "../checks/CheckReadmeImages.vue";
import CheckIndex from "../checks/CheckIndex.vue";
import CheckFavIcon from "../checks/CheckFavIcon.vue";
import DisplayValue from "../checks/DisplayValue.vue";
import SearchString from "../checks/SearchString.vue";
import CheckDependencies from "../checks/CheckDependencies.vue";
import CheckViteConfig from "../checks/CheckViteConfig.vue";
import CheckEslint from "../checks/CheckEslint.vue";
import CheckRoutes from "../checks/CheckRoutes.vue";
import CheckEvents from "../checks/CheckEvents.vue";
import CheckFile from "../checks/CheckFile.vue";
import CommitsChart from "../components/CommitsChart.vue";
import InterschoolBuild from "../checks/InterschoolBuild.vue";

import { formatDistanceToNowStrict } from "date-fns";
import { committer_colors } from "../colors.js";

const CheckLastCommit = {
  component: DisplayValue,
  title: "Last Commit",
  args: {
    value: (repo) => {
      const lastCommit = repo.commits[0];
      return lastCommit
        ? formatDistanceToNowStrict(new Date(lastCommit.commit.author.date))
        : "no commits";
    },
  },
};

const checksPresets = {
  basic: [CheckCollaborators, CheckCommits, CheckLastCommit],
  vue: [
    CheckCollaborators,
    CheckCommits,
    CheckLastCommit,
    {
      component: DisplayValue,
      title: "Main",
      args: {
        value: "hasMain",
        href: (repo) => `${toRepo(repo.name)}/tree/main`,
      },
    },
    {
      component: DisplayValue,
      title: "GhPages",
      args: {
        value: "hasGhPages",
        href: (repo) => `${toRepo(repo.name)}/tree/gh-pages`,
      },
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
    CheckFavIcon,
    CheckBranches,
    {
      component: DisplayValue,
      title: "Tags",
      args: {
        value: "releases",
      },
    },
    {
      component: DisplayValue,
      title: "Style",
      args: { value: "style" },
    },
    CheckDependencies,
    CheckEslint,
    CheckRoutes,
    {
      component: DisplayValue,
      title: "Route Params",
      args: {
        value: (repo) => {
          return repo.routes?.filter((r) => r.includes(":"));
        },
      },
    },
    // search is low because of rate limit add it at the end
    {
      component: SearchString,
      title: "WebHashHistory",
      args: {
        q: "createWebHashHistory in:file extension:js",
      },
    },
    {
      component: SearchString,
      title: "$router",
      args: {
        q: "$router in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "axios",
      args: {
        q: "axios in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "props",
      args: {
        q: "props in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "$emit",
      args: {
        q: "$emit in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "$root",
      args: {
        q: "$root in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "JSON.parse",
      args: {
        q: "JSON.parse in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "JSON.stringify",
      args: {
        q: "JSON.stringify in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "console.log",
      args: {
        q: "console.log in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "localStorage",
      args: {
        q: "localStorage in:file extension:js extension:vue",
      },
    },
  ],
  "interschool-readme": [
    CheckCollaborators,
    CheckCommits,
    CheckLastCommit,
    CheckBranches,
    CheckEvents,
    CheckReadmeMembers,
    CheckReadmeImages,
  ],
  "interschool-project": [
    CheckCollaborators,
    CheckCommits,
    CheckLastCommit,
    CheckBranches,
    {
      component: CheckFile,
      title: "Models",
      args: {
        path: "backend/api/models.py",
        regex: /class (.*?)\(/g,
      },
    },
    {
      component: CheckFile,
      title: "Admin",
      args: {
        path: "backend/api/admin.py",
        regex: /class (.*?)\(|register\(.*?\)/g,
      },
    },
    {
      component: CheckFile,
      title: "Urls",
      args: {
        path: "backend/urls.py",
        regex: /router.register\((.*?)\)/g,
      },
    },
    CheckDependencies,
    CheckRoutes,
    {
      component: SearchString,
      title: "pycache",
      args: {
        q: "__pycache__",
      },
    },
    {
      component: SearchString,
      title: "axios",
      args: {
        q: "axios in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "localhost",
      args: {
        q: "localhost in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "127.0.0.1",
      args: {
        q: "127.0.0.1 in:file extension:js extension:vue",
      },
    },
    {
      component: SearchString,
      title: "pycache",
      args: {
        q: "__pycache__",
      },
    },
    {
      component: InterschoolBuild,
      title: InterschoolBuild.title,
      onlyManualUpdate: true,
    }
  ],
};

const search = ref("");
const cutOff = ref(4);

const assignmentsChecksFiltered = computed(() => {
  return (checksPresets[store.assignment.check] || []).filter((c) => {
    if (c.component === SearchString) {
      return main.showSearch;
    }
    return true;
  });
});

const sortedAssignments = computed(() => {
  return Object.keys(main.assignments)
    .filter((a) => {
      const repoA = main.assignments[a];
      return (
        repoA.name.includes(search.value) ||
        repoA.users.some((u) => {
          if (!githubUsernameLookup[u.login]) {
            console.log("no name for", u.login);
            return true;
          }
          return githubUsernameLookup[u.login].includes(search.value);
        })
      );
    })
    .sort((a, b) => {
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

function clear() {
  if (confirm("Are you sure you want to clear all assignments?")) {
    main.assignments = {};
    main.saveAssignments();
  }
}

function fetchAndRefresh() {
  async function getRepos(page) {
    await axios
      .get(
        `${API}orgs/${GITHUB_ORG}/repos?sort=created&direction=desc&per_page=100&page=${page}`
      )
      .then(async (response) => {
        response.data
          .filter((repo) => {
            const cutOffDate =
              new Date().getTime() - 1000 * 60 * 60 * 24 * 30 * cutOff.value;
            const isOlderThanCutOff =
              new Date(repo.created_at).getTime() < cutOffDate;
            const isInBlacklist = USERNAME_BLACKLIST.some((name) =>
              repo.name.includes(name)
            );
            const startsWithPrefix = repo.name.startsWith(
              store.assignment.prefix
            );
            const isExactMatch = repo.name === store.assignment.prefix;
            return (
              (!isInBlacklist && startsWithPrefix && !isOlderThanCutOff) ||
              isExactMatch
            );
          })
          .forEach((repo) => {
            let r = reactive({ name: repo.name, created_at: repo.created_at });
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
          const match = response.headers.link.match(/page=(\d+)>; rel="next"/);
          if (match) {
            await getRepos(match[1]);
          }
        }
      });
  }
  getRepos(1);
}

function refreshAll() {
  for (const repo of Object.values(main.assignments)) {
    refreshAssignment(repo);
  }
}

function promptRemove(name) {
  if (confirm('Are you sure you want to remove "' + name + '"?')) {
    delete main.assignments[name];
    main.saveAssignments();
  }
}

async function refreshAssignment(repo) {
  repo.errors = new WeakMap();
  repo.running = new WeakMap();
  for (const checkComponent of assignmentsChecksFiltered.value) {
    await refreshCheckComponent(repo, checkComponent);
  }
}

async function refreshCheckComponent(repo, checkComponent, auto = true) {
  if (checkComponent.onlyManualUpdate && auto) {
    return;
  }
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
      if (Array.isArray(checkComponent.args)) {
        await checkComponent.component.check(repo, ...checkComponent.args);
      } else {
        await checkComponent.component.check(repo, checkComponent.args);
      }
    } else {
      await checkComponent.check(repo);
    }
  } catch (e) {
    console.log(e);
    repo.errors.set(checkComponent, e);
  } finally {
    repo.running.set(checkComponent, false);
    main.saveAssignments();
  }
}

function refreshCheckRow(checkComponent) {
  for (const repo of Object.values(main.assignments)) {
    refreshCheckComponent(repo, checkComponent, false);
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
  <div v-if="store.assignment">
    <div class="submenu">
      <label
        >Prefix:
        <input
          style="width: 80px"
          type="text"
          placeholder="prefix"
          @change="
            (event) => updateCurrentAssignment({ prefix: event.target.value })
          "
          :value="store.assignment.prefix"
      /></label>
      <label
        >CutOff
        <input v-model.number="cutOff" type="number" style="width: 30px" />
      </label>
      <button @click="fetchAndRefresh()">fetch repos</button>
      <span
        >{{ main.ghApi.rateLimit.remaining }} /
        {{ main.ghApi.rateLimit.limit }} reset in
        {{ main.ghApi.rateLimit.resetCoutdown() }} min
        {{ main.ghApi.rateLimitQueue.length }} in queue
      </span>

      <label
        ><input type="checkbox" v-model="main.showDetails" /> Details</label
      >
      <label><input type="checkbox" v-model="main.showSearch" /> Search</label>
      <label><input type="checkbox" v-model="main.showPic" /> Pic</label>
      <label
        ><input type="checkbox" v-model="main.showCards" /> Cards View</label
      >
      <label>
        Checks:
        <select
          @change="
            (event) => updateCurrentAssignment({ check: event.target.value })
          "
        >
          <option
            v-for="(value, o) in checksPresets"
            :key="o"
            :selected="o == store.assignment.check"
          >
            {{ o }}
          </option>
        </select>
      </label>
      <span class="spacer"></span>
      <a :href="getUrls()" download="urls.txt">download urls.txt</a>
      <button @click="clear()">clear</button>
    </div>

    <h2>Checks <input v-model="search" placeholder="filter" /></h2>
    <div class="overflow" v-if="!main.showCards">
      <table>
        <thead>
          <tr>
            <th @click="refreshAll()">🗘</th>
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
            <td @dblclick="promptRemove(name)">{{ name }}</td>
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
                      ).isCorrect(
                        main.assignments[name],
                        checkComponent.args
                      ) === undefined
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
                                                                        main
                                                                          .assignments[
                                                                          name
                                                                        ]
                                                                          .running &&
                                                                        main
                                                                          .assignments[
                                                                          name
                                                                        ]
                                                                          .running
                                                                          .constructor
                                                                          .name ===
                                                                          'WeakMap' &&
                                                                        main.assignments[
                                                                          name
                                                                        ].running.has(
                                                                          checkComponent
                                                                        )
                                                                          ? main.assignments[
                                                                              name
                                                                            ].running.get(
                                                                              checkComponent
                                                                            )
                                                                            ? 'running'
                                                                            : 'done'
                                                                          : ''
                                                                      }`"
              @dblclick="
                refreshCheckComponent(main.assignments[name], checkComponent, false)
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
    <div v-if="main.showCards">
      <div v-for="(name, index) in sortedAssignments" :key="name" class="card">
        <h2 @click="refreshAssignment(main.assignments[name])">
          {{ name }} #{{ index + 1 }}
        </h2>
        <div
          v-for="(checkComponent, index) in assignmentsChecksFiltered"
          :key="index"
          @dblclick="
            refreshCheckComponent(main.assignments[name], checkComponent, false)
          "
          class="row"
        >
          <div class="label">{{ checkComponent.title }}</div>
          <div
            :class="`content ${
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
                                                                main
                                                                  .assignments[
                                                                  name
                                                                ].running &&
                                                                main
                                                                  .assignments[
                                                                  name
                                                                ].running
                                                                  .constructor
                                                                  .name ===
                                                                  'WeakMap' &&
                                                                main.assignments[
                                                                  name
                                                                ].running.has(
                                                                  checkComponent
                                                                )
                                                                  ? main.assignments[
                                                                      name
                                                                    ].running.get(
                                                                      checkComponent
                                                                    )
                                                                    ? 'running'
                                                                    : 'done'
                                                                  : ''
                                                              }`"
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
          </div>
        </div>
      </div>
    </div>
    <div class="commit-container">
      <div v-if="main.commits.length > 0" class="row">
        <div class="col-6">
          <div
            v-for="c in main.commits.filter(
              (c) => c.commit.author.name !== 'github-classroom[bot]'
            )"
            class="`commit"
            :style="{
              backgroundColor:
                committer_colors[getCommiterIndex(c.commit.author.name)],
            }"
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
        <div class="col-6 pa-3">
          <div>
            <commits-chart :commits="main.commits" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.commit-container {
  bottom: 0;
  position: fixed !important;
  background: white;
  width: 100%;
  max-height: 300px;
  box-shadow: 0px -1px 2px 0px #9e9e9e52;
  overflow: auto;
}

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
  cursor: pointer;
}

th:hover {
  background-color: #509ee3;
  color: white;
}

tbody td {
  border: 1px solid #eeecec;
  padding: 0 8px;
}

.commit {
  padding: 2px;
}

.merge {
  background-color: rgb(237, 201, 135);
}

.card {
  border: 1px solid rgb(243 242 241);
  padding: 12px;
  border-radius: 6px;
  box-shadow: rgb(0 0 0 / 10%) 0px 4px 12px;
  max-width: 800px;
  margin: 20px auto;
}

.card h2 {
  padding-bottom: 16px;
}

.card .row {
  padding: 4px 0;
}

.card .row:hover {
  background-color: #ffffcc;
}

.card .label {
  width: 150px;
  font-weight: bold;
}

.card .content * {
  text-align: left !important;
}

.card .content ul {
  margin-left: 1em;
}
</style>
