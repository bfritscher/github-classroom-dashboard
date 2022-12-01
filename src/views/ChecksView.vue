<script setup>
import { repoToGhPagesUrl } from "../filters.js";
import { main } from "../main.js";

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

main.getCommiterIndex = function (name) {
  if (main.commiterIndex.indexOf(name) === -1) {
    main.commiterIndex.push(name);
  }
  return main.commiterIndex.indexOf(name);
};
</script>

<template>
  <h2>Checks</h2>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Project</th>
        <th v-for="(check, index) in main.assignmentsChecks" :key="index">
          {{ check.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(repo, name, index) in main.assignments" :key="name">
        <td @click="main.refreshAssignment(repo)">{{ index + 1 }}</td>
        <td>{{ name }}</td>
        <td
          v-for="(checkComponent, index) in main.assignmentsChecks"
          :key="index"
          :class="`${
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
          } ${
            repo.errors &&
            repo.errors.constructor.name === 'WeakMap' &&
            repo.errors.has(checkComponent)
              ? 'error'
              : ''
          }

          ${
            repo.running &&
            repo.running.constructor.name === 'WeakMap' &&
            repo.running.has(checkComponent)
              ? (repo.running.get(checkComponent) ? 'running' : 'done')
              : ''
          }`"
          @dblclick="main.refreshCheckComponent(repo, checkComponent)"
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
</template>

<style>
.correct,
.correct a {
  color: green;
}

.wrong,
.wrong a {
  color: red;
}

.error {
  background-color: red;
}

.running {
  background-color: yellow;
}

table {
  border-collapse: collapse;
}

tbody td {
  border: 1px solid #333;
  padding: 2px;
}
</style>
