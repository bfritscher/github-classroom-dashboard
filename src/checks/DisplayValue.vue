<template>
  <a v-if="props.args[1]" :href="props.args[1](props.repo)" target="_blank">
    <value-or-list :value="props.repo[props.args[0]]" />
  </a>
  <value-or-list v-else :value="props.repo[props.args[0]]" />
</template>
<script>
import ValueOrList from "../components/ValueOrList.vue";

function isCorrect(repo, args) {
    return typeof repo[args[0]] === "boolean" ? repo[args[0]] : undefined;
  }
export default {
  props: {
    repo: Object,
    args: Array,
  },
  components: {
    ValueOrList,
  },
  title: "Display",
  check: async () => {},
  isCorrect,
  total(repos, args) {
    return repos.filter((repo) => isCorrect(repo, args)).length;
  },
  setup(props) {
    return { props, isArray: () => Array.isArray(props.repo[props.args[0]]) };
  },
};
</script>
