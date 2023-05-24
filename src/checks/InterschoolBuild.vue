<template>
  <div class="text-center">
    <a
      target="_blank"
      :href="`https://${props.repo.name
        .replace('project-', '')
        .replace('_', '-')}.rxq.ch`"
    >
      web
    </a>
  </div>
</template>
<script>
import axios from "axios";

function triggerBuild(repo) {
  let url = `https://builder.rxq.ch/build?org=heg-interschool&repo=${repo.name}`;
  if (repo.baseDirOverride) {
    url += `&override=/${repo.baseDirOverride}`;
  }
  return axios.get(url);
}

export default {
  props: {
    repo: Object,
  },
  title: "Build",
  check: triggerBuild,
  setup(props) {
    return { props };
  },
};
</script>
