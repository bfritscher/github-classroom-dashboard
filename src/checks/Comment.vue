<template>
  <div
    @dblclick="showEdit = !showEdit"
    :class="{ editHidden: !showEdit }"
    title="dblclik to edit"
  >
    <textarea
      v-if="showEdit"
      type="text"
      v-model="props.repo.comment"
      @change="main.saveAssignments"
    ></textarea>
    <pre v-else>{{ props.repo.comment }}</pre>
  </div>
</template>
<script>
import { ref } from "vue";
import { main } from "../main.js";

export default {
  props: {
    repo: Object,
    args: Object,
  },
  title: "Comment",
  check(repo) {
    if (!repo.comment) {
      repo.comment = "";
    }
  },
  setup(props) {
    const showEdit = ref(false);
    return {
      showEdit: showEdit,
      main,
      props,
    };
  },
};
</script>
<style>
.editHidden {
  min-height: 20px;
}
.editHidden:hover {
  background-color: #ffffcc;
  cursor: pointer;
}
</style>
