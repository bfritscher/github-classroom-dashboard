<template>
  <a v-if="props.args.href" :href="props.args.href(props.repo)" target="_blank">
    <value-or-list :value="value" />
  </a>
  <value-or-list v-else :value="value" />
</template>
<script>
import ValueOrList from "../components/ValueOrList.vue";
import { computed } from "vue";

function getValue(repo, args) {
  if (typeof args.value === "function") {
    try {
      return args.value(repo);
    } catch (e) {
      return "error";
    }
  }
  return repo[args.value];
}

function isCorrect(repo, args) {
  const value = getValue(repo, args);
  return typeof value === "boolean" ? value : undefined;
}
export default {
  props: {
    repo: Object,
    args: Object,
  },
  components: {
    ValueOrList,
  },
  title: "Display",
  check: async () => {},
  isCorrect,
  sortValue(repo, args) {
    return getValue(repo, args);
  },
  total(repos, args) {
    let total = 0;
    let seen_bool = false;
    for (const repo of repos) {
      const correct = isCorrect(repo, args);
      if (typeof correct === "boolean") {
        seen_bool = true;
        total += correct ? 1 : 0;
      }
    }
    return seen_bool ? total : "";
  },
  setup(props) {
    const value = computed(() => {
      return getValue(props.repo, props.args);
    });
    return { props, value };
  },
};
</script>
