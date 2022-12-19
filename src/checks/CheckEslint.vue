<template>
  <a target="_blank" :href="eslintUrl">
    <div
      v-if="
        props.repo.eslint &&
        (props.repo.eslint.warnings >= 0 || props.repo.eslint.errors >= 0)
      "
    >
      <div
        class="subrow"
        :class="{
          warn: props.repo.eslint.warnings > 0,
          correct: props.repo.eslint.warnings === 0,
        }"
      >
        <span>w:</span>
        <span class="flex text-right">{{ props.repo.eslint.warnings }}</span>
      </div>
      <div
        class="subrow"
        :class="{
          wrong: props.repo.eslint.errors > 0,
          correct: props.repo.eslint.errors === 0,
        }"
      >
        <span>e:</span>
        <span class="flex text-right">{{ props.repo.eslint.errors }}</span>
      </div>
    </div>
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";

const eslintRegex = /\((\d+) error.?, (\d+) warning.?\)/;

function checkEslint(repo) {
  repo.eslint = {
    errors: undefined,
    warnings: undefined,
  };
  return axios
    .get(`https://pweb.bf0.ch/results/${repo.name}/lint.log`)
    .then((response) => {
      const match = response.data.match(eslintRegex);
      if (match) {
        repo.eslint.errors = parseInt(match[1]);
        repo.eslint.warnings = parseInt(match[2]);
      } else if (!match && response.data.includes("> eslint")) {
        repo.eslint.errors = 0;
        repo.eslint.warnings = 0;
      }
    });
}
function isCorrect(repo) {
  return repo.eslint && repo.eslint.errors === 0 && repo.eslint.warnings === 0;
}

export default {
  props: {
    repo: Object,
  },
  title: "ESlint",
  check: checkEslint,
  isCorrect,
  total(repos) {
    return repos.filter((repo) => isCorrect(repo)).length;
  },
  setup(props) {
    return {
      props,
      eslintUrl: computed(
        () => `https://pweb.bf0.ch/results/${props.repo.name}/lint.log`
      ),
    };
  },
};
</script>
<style scoped>
.subrow {
  display: flex;
  flex-direction: row;
  gap: 4px;
}
</style>
