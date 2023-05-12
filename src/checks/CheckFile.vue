<template>
  <a target="_blank" :href="fileBrowse">
    <template
      v-if="
        props.repo.filesContentMatch &&
        props.repo.filesContentMatch[props.args.path]
      "
    >
      <div class="text-right">
        {{ props.repo.filesContentMatch[props.args.path].length }}
      </div>
      <ul v-if="main.showDetails">
        <li
          v-for="m in props.repo.filesContentMatch[props.args.path]"
          :key="m"
          class="text-nowrap"
        >
          {{ m[1] ? m[1] : m[0] }}
        </li>
      </ul>
    </template>
    <template v-else>
      {{ props.repo.files && props.repo.files[props.args.path] ? "✅" : "❌" }}
    </template>
  </a>
  <div
    @dblclick="showOverride = true"
    :class="{ overrideHidden: !showOverride }"
    title="dblclik to override base path"
  >
    <input
      v-if="showOverride"
      type="text"
      v-model="props.repo.baseDirOverride"
      @change="main.saveAssignments"
      @dblclick.stop="showOverride = false"
    />
  </div>
</template>
<script>
import axios from "axios";
import { computed, ref } from "vue";
import { main } from "../main.js";
import { toRepo, toRepoAPI, b64DecodeUnicode } from "../filters.js";

function getFile(repo, args) {
  if (!repo.files) {
    repo.files = {};
  }
  if (!repo.filesContentMatch) {
    repo.filesContentMatch = {};
  }
  repo.files[args.path] = false;
  repo.filesContentMatch[args.path] = [];
  return axios
    .get(
      `${toRepoAPI(repo.name)}/contents/${repo.baseDirOverride || ""}${
        args.path
      }`
    )
    .then((response) => {
      repo.files[args.path] = true;
      if (args.regex) {
        const content = b64DecodeUnicode(response.data.content);
        const matches = content.matchAll(args.regex);
        repo.filesContentMatch[args.path] = [...matches];
      }
    });
}

function isCorrect(repo, args) {
  return repo.files && repo.files[args.path];
}

export default {
  props: {
    repo: Object,
    args: Object,
  },
  title: "File",
  check: getFile,
  isCorrect,
  total(repos) {
    return repos.reduce((total, repo) => {
      return total + (repo.hasEvents ? 1 : 0);
    }, 0);
  },
  setup(props) {
    const showOverride = ref(false);
    return {
      showOverride,
      main,
      props,
      fileBrowse: computed(
        () =>
          `${toRepo(props.repo.name)}/blob/main/${
            props.repo.baseDirOverride || ""
          }${props.args.path}`
      ),
    };
  },
};
</script>
<style>
.overrideHidden {
  height: 20px;
}
.overrideHidden:hover {
  background-color: #ffffcc;
  cursor: pointer;
}
</style>
