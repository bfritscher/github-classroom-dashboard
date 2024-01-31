<template>
  <div class="text-center">
    <a
      target="_blank"
      :href="`${repoUrl}/blob/main/${
        repo.baseDirOverride || ''
      }android/app/src/main/AndroidManifest.xml`"
      class="text-nowrap favicon"
    >
      <img v-if="props.repo.androidIcon" :src="props.repo.androidIcon" />
      <span v-else>false</span>
      <div>{{ props.repo.androidLabel }}</div>
    </a>
  </div>
</template>
<script>
import axios from "axios";
import { computed } from "vue";
import { b64DecodeUnicode, toRepoAPI, toRepo } from "../filters.js";

function checkIndex(repo) {
  repo.androidLabel = false;
  repo.androidIcon = false;
  return axios
    .get(
      `${toRepoAPI(repo.name)}/contents/${
        repo.baseDirOverride || ""
      }android/app/src/main/AndroidManifest.xml`
    )
    .then((response) => {
      const regexIcon = /android:icon="@mipmap\/(.*?)"/gm;
      const xml = b64DecodeUnicode(response.data.content);
      let match = regexIcon.exec(xml);
      if (match) {
        axios
          .get(
            `${toRepoAPI(repo.name)}/contents/${
              repo.baseDirOverride || ""
            }android/app/src/main/res/mipmap-mdpi/${match[1]}.png`
          )
          .then((response2) => {
            console.log(response2);
            repo.androidIcon = `data:image/png;base64,${response2.data.content}`;
          })
          .catch(() => {
            repo.androidIcon = false;
          });
      } else {
        repo.androidIcon = false;
      }
      const regexLabel = /android:label="(.*?)"/gm;
      match = regexLabel.exec(xml);
      if (match) {
        repo.androidLabel = match[1];
      } else {
        repo.androidLabel = false;
      }
    });
}

export default {
  props: {
    repo: Object,
  },
  title: "AndroidIcon",
  check: checkIndex,
  setup(props) {
    return { props, repoUrl: computed(() => toRepo(props.repo.name)) };
  },
};
</script>

<style>
.favicon img {
  width: 100%;
  max-width: 28px;
}
</style>
