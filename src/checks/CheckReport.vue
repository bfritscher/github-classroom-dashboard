<template>
  <a target="_blank" :href="reportUrl">
    <span v-if="props.repo.report"
      >{{ props.repo.report.passed }} / {{ props.repo.report.total }}</span
    >
  </a>
</template>
<script>
import axios from "axios";
import { computed } from "vue";

function checkReport(repo) {
  repo.report = {
    passed: undefined,
    total: undefined,
  };
  return axios
    .get(`https://pweb.bf0.ch/results/${repo.name}/report.json`)
    .then((response) => {
      if (response.data?.summary) {
        repo.report = response.data.summary;
      }
    });
}
function isCorrect(repo) {
  return repo.report && repo.report.passed === repo.report.total;
}

export default {
  props: {
    repo: Object,
  },
  title: "CI Report",
  check: checkReport,
  isCorrect,
  total(repos) {
    return repos.filter((repo) => isCorrect(repo)).length;
  },
  setup(props) {
    return {
      props,
      reportUrl: computed(
        () => `https://pweb.bf0.ch/results/${props.repo.name}/`
      ),
    };
  },
};
</script>
