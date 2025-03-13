<template>
  <a target="_blank" :href="`${repoUrl}`" class="text-nowrap">
    {{ count }}
  </a>
  <div v-if="main.showDetails">
    <div
      v-for="(value, key) in repo.djangolevel1"
      :key="key"
      class="text-nowrap detail"
    >
      <b>{{ key }}:</b> <span>{{ value ? "✅" : "❌" }}</span>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";
import { main } from "../main.js";

function checkIndex(repo) {
  repo.djangolevel1 = {};
  return Promise.all([
    axios
      .get(`${toRepoAPI(repo.name)}/contents/parcel_manager/models.py`)
      .then((response) => {
        const query = ["Order", "Product", "ForeignKey"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel1[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/parcel_manager/serializers.py`)
      .then((response) => {
        const query = ["OrderSerializer", "ProductSerializer", "class Meta:"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel1[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/parcel_manager/urls.py`)
      .then((response) => {
        const query = ["DefaultRouter()", "register"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel1[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/parcel_manager/views.py`)
      .then((response) => {
        const query = [
          "ModelViewSet",
          "queryset",
          "serializer_class",
          "permission_classes",
        ];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel1[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/parcel_project/urls.py`)
      .then((response) => {
        const query = ["DefaultRouter()", "register"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel1[`project_${q}`] = html.includes(q);
        }
      }),
    // views or api
  ]);
}

export default {
  props: {
    repo: Object,
  },
  title: "Django Level1",
  check: checkIndex,
  setup(props) {
    return {
      props,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      count: computed(
        () => Object.values(props.repo.djangolevel1).filter((v) => v).length
      ),
    };
  },
};
</script>
<style scoped>
.detail {
  width: 150px;
  text-align: right;
}
b {
  float: left;
}
</style>
