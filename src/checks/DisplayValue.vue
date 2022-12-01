<template>
  <a v-if="props.args[1]" :href="props.args[1](props.repo)" target="_blank">
    {{ props.repo[props.args[0]] }}
  </a>
  <span v-else>{{ props.repo[props.args[0]] }}</span>
</template>
<script>
export default {
  props: {
    repo: Object,
    args: Array,
  },
  title: "Display",
  check: async () => {},
  isCorrect(repo, args) {
    return typeof repo[args[0]] === "boolean" ? repo[args[0]] : undefined;
  },
  setup(props) {
    return { props };
  },
};
</script>
