<template>
  <span v-if="isArray">
    {{ value.length }}
    <ul v-if="main.showDetails">
      <li v-for="item in value" :key="item">{{ item }}</li>
    </ul>
  </span>
  <span v-else>{{ value }}</span>
</template>
<script setup>
import { computed } from "vue";
import { main } from "../main.js";
const props = defineProps(["value"]);
const isArray = computed(() => Array.isArray(props.value));
</script>
