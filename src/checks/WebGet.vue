<template>
  <div class="text-center">
    update
  </div>
</template>
<script>
import axios from "axios";

function webGet(repo, args) {
  let url = `NOT SET`;
  if (args.url) {
    url = args.url(repo);
  }
  return axios.get(url);
}

export default {
  props: {
    repo: Object,
  },
  title: "WebGet",
  check: webGet,
  setup(props) {
    return { props };
  },
};
</script>
