<template>
  <a target="_blank" :href="`${repoUrl}`" class="text-nowrap">
    {{ count }}
  </a>
  <div v-if="main.showDetails">
    <div
      v-for="(value, key) in repo.djangolevel2"
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
  repo.djangolevel2 = {};
  return Promise.all([
    axios
      .get(`${toRepoAPI(repo.name)}/contents/backend/shop/admin.py`)
      .then((response) => {
        const query = ["OrderLineInline", "obj.total"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/backend/shop/serializers.py`)
      .then((response) => {
        const query = ["orderlines =", "get_total"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/backend/project/settings.py`)
      .then((response) => {
        const query = [
          "corsheaders",
          "corsheaders.middleware.CorsMiddleware",
          "CORS_ALLOWED_ORIGINS",
          "CORS_ALLOW_CREDENTIALS",
          "debug_toolbar",
          "debug_toolbar.middleware.DebugToolbarMiddleware",
          "INTERNAL_IPS",
          "CSRF_TRUSTED_ORIGINS",
        ];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/backend/shop/models.py`)
      .then((response) => {
        const query = ["OrderManager", "self.total_price"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),
    axios
      .get(`${toRepoAPI(repo.name)}/contents/backend/shop/api.py`)
      .then((response) => {
        const query = ["IsSuperAdminOrReadOnly", "customer=self.request.user"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),
    axios
      .get(
        `${toRepoAPI(repo.name)}/contents/frontend/src/components/OrderEntry.vue`
      )
      .then((response) => {
        const query = ["withXSRFToken"];
        const html = b64DecodeUnicode(response.data.content);
        for (const q of query) {
          repo.djangolevel2[q] = html.includes(q);
        }
      }),

    // withXSRFToken
  ]);
}

export default {
  props: {
    repo: Object,
  },
  title: "Django Advanced",
  check: checkIndex,
  setup(props) {
    return {
      props,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      count: computed(
        () => Object.values(props.repo.djangolevel2).filter((v) => v).length
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
