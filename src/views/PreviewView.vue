<script setup>
import { ref, computed } from "vue";
import { main } from "../main.js";
import { store } from "../appwrite.js";
// UI states
const displayMobilePreview = ref(false);

function toPreviewUrl(repo) {
  if (store?.course?.github_org === "heg-web") {
    return `https://heg-web.github.io/${repo.name}`;
  }
  if (store?.course?.github_org === "heg-interschool") {
    return `https://${repo.name
      .replace("project-", "")
      .replace("_", "-")}.rxq.ch`;
  }
}
const sortedAssignments = computed(() => {
  return Object.values(main.assignments).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});
</script>

<template>
  <h2>Preview</h2>
  <label><input type="checkbox" v-model="displayMobilePreview" /> Mobile</label>
  <div id="preview" :class="{ noMobile: !displayMobilePreview }">
    <div
      class="preview"
      :class="{ 'preview-zoom': main.zoom == a }"
      v-for="a in sortedAssignments"
      :key="a.name"
    >
      <div>
        <a target="_blank" :href="toPreviewUrl(a)"
          >{{ a.name }}
          <span :class="{ correct: a.hasVendor, wrong: !a.hasVendor }">{{
            a.hasVendor
          }}</span></a
        >
        <span class="zoom-toggle" v-if="main.zoom != a" @click="main.zoom = a"
          >show</span
        >
        <span
          class="zoom-toggle"
          v-if="main.zoom == a"
          @click="main.zoom = null"
          >close</span
        >
      </div>
      <div class="preview-iframes">
        <div v-if="displayMobilePreview">
          <iframe
            style="
              position: absolute;
              width: 640px;
              height: 3000px;
              transform: scale3d(0.2, 0.2, 1) translate3d(-1300px, -6000px, 0);
            "
            :src="toPreviewUrl(a)"
          ></iframe>
        </div>
        <div v-if="displayMobilePreview">
          <iframe
            style="
              position: absolute;
              width: 1024px;
              height: 3000px;
              transform: scale3d(0.2, 0.2, 1) translate3d(-2040px, -6000px, 0);
            "
            :src="toPreviewUrl(a)"
          ></iframe>
        </div>
        <div v-if="displayMobilePreview">
          <iframe
            style="
              position: absolute;
              width: 1600px;
              height: 3000px;
              transform: scale3d(0.2, 0.2, 1) translate3d(-3200px, -6000px, 0);
            "
            :src="toPreviewUrl(a)"
          ></iframe>
        </div>
        <div v-if="!displayMobilePreview">
          <iframe
            style="
              position: absolute;
              width: 1600px;
              height: 3000px;
              transform: scale3d(0.3, 0.3, 1) translate3d(-1850px, -3500px, 0);
            "
            :src="toPreviewUrl(a)"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#preview {
  display: flex;
  flex-wrap: wrap;
}

.preview {
  width: 700px;
  height: 400px;
  overflow: hidden;
}

.zoom-toggle {
  float: right;
  padding-right: 10px;
  cursor: pointer;
}

.preview-zoom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.preview-zoom .preview-iframes > div {
  height: 100vh;
}

.preview-zoom .preview-iframes iframe {
  height: 100% !important;
  width: 100% !important;
  transform: none !important;
}

.preview a {
  font-size: 12pt;
  color: black;
  font-weight: bold;
  padding: 4px 0;
}

.preview img {
  vertical-align: top;
}

.preview img:nth-child(1),
.preview .preview-iframes > div:nth-child(1) {
  width: 20%;
}

.preview img:nth-child(2),
.preview .preview-iframes > div:nth-child(2) {
  width: 32%;
}

.preview img:nth-child(3),
.preview .preview-iframes > div:nth-child(3) {
  width: 46%;
}

.preview-iframes > div {
  position: relative;
  height: 400px;
  overflow: auto;
  float: left;
}

.noMobile .preview-iframes > div {
  width: 100% !important;
}

.noMobile .preview {
  width: 500px;
  height: 400px;
}
</style>
