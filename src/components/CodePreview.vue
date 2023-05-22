<template>
  <div class="code-preview">
    <pre><code v-html="code"></code></pre>
    <div class="line-col">
      <div v-for="l in lines" :key="l">{{ l }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const props = defineProps(["value", "offset"]);
const lines = computed(
  () => props.value?.split("\n")?.map((l, i) => props.offset + i) || []
);
const code = computed(() => {
  let content = escapeHtml(props.value);
  content = content.replaceAll(/&lt;mark&gt;/g, "<mark>");
  content = content.replaceAll(/&lt;\/mark&gt;/g, "</mark>");
  return content;
})
</script>
<style scoped>
pre {
  margin: 0;
  padding-left: 3em;
}

.code-preview {
  background-color: #fff;
  position: relative;
  overflow-y: hidden;
  overflow-x: auto;
  max-width: 600px;
  border: 1px solid #509ee3;
}

.line-col {
  text-align: right;
  font-family: monospace;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: #f5f5f5;
  color: #509ee3;
  width: 2em;
  padding-right: 0.2em;
}
</style>
