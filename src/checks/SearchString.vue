<template>
  <div v-if="props.repo.search && props.repo.search[props.args.q]">
    <a
      :href="`https://github.com/search?q=repo%3A${GITHUB_ORG}%2F${
        props.repo.name
      }+${toGithubSearch(props.args.q)}&type=code`"
      target="_blank"
      >{{ props.repo.search[props.args.q].total_count }}</a
    >
    <ul v-if="main.showDetails">
      <li
        v-for="(e, index) in props.repo.search[props.args.q].items"
        :key="index"
        class="link-tocode"
      >
        <!-- TODO compute from path and org-->
        <a
          :href="`${repoUrl}/blob/${repo.hasMain ? 'main' : 'master'}/${
            e.path
          }#L${e.line}`"
          target="_blank"
          @mouseenter="showPreview = e"
          @mouseleave="showPreview = false"
          >{{ e.path
          }}<span v-if="e.line" class="line-number">#L{{ e.line }}</span></a
        >
        <code-preview
          class="inline-codepreview"
          v-if="showPreview === e"
          :value="e.snippet"
          :offset="e.line"
        ></code-preview>
        <!-- TODO handle snippet display -->
      </li>
    </ul>
  </div>
</template>
<script>
import axios from "axios";
import { computed, ref } from "vue";
import { API, GITHUB_ORG, CUSTOM_SEARCH_API } from "../config.js";
import { toRepo } from "../filters.js";
import { main } from "../main.js";
import CodePreview from "../components/CodePreview.vue";
/* TODO handle custom search and githubsearch */
function searchString(repo, args) {
  if (!Object.prototype.hasOwnProperty.call(repo, "search")) {
    repo.search = {};
  }
  repo.search[args.q] = { total_count: -1, items: [] };
  const searchTxt = `${args.q} repo:${GITHUB_ORG}/${repo.name}`;
  //const searchTxt = `addClass in:file+language:js+repo:jquery/jquery`;
  return axios
    .get(`${CUSTOM_SEARCH_API}search/code?q=${encodeURIComponent(searchTxt)}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    })
    .then((response) => {
      repo.search[args.q] = response.data;
    });
}

function toGithubSearch(q) {
  return q.replaceAll(/extension:[^ ]+/g, "").replaceAll("in:file", "");
}

export default {
  props: {
    repo: Object,
    args: Object,
  },
  components: {
    CodePreview,
  },
  title: "Search",
  check: searchString,
  setup(props) {
    const showPreview = ref(false);
    return {
      showPreview,
      props,
      main,
      GITHUB_ORG,
      toGithubSearch,
      repoUrl: computed(() => toRepo(props.repo.name)),
    };
  },
};
</script>
<style scoped>
.line-number {
  font-size: 80%;
  font-style: italic;
}
.link-tocode {
  position: relative;
}
.inline-codepreview {
  position: absolute;
  right: 0;
  z-index: 99;
}
</style>
