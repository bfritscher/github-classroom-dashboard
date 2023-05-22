<template>
  <div class="code-preview">
    <pre>
    <code v-html="props.value"></code>
    </pre>
    <div class="line-col">
      <div v-for="l in lines" :key="l">{{ l }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";

const props = defineProps(["value", "offset"]);
const lines = computed(
  () => props.value?.split("\n")?.map((l, i) => props.offset + i) || []
);
</script>
<style scoped>
pre {
  margin: 0;
  padding-left: 3em;
}
.code-preview {
  background-color: #f5f9fc;
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
  background-color:  white;
  color: #509ee3;
  width: 2em;
}
</style>
