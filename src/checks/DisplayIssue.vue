<template>
  <div
    style="display: inline-block; position: relative"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <a
      v-if="issue"
      target="_blank"
      :href="`${repoUrl}/issues/${issue.number}`"
      class="text-nowrap"
      >{{ issue.stats.closed }} / {{ issue.stats.total }}</a
    >
    <ul
      v-if="main.showDetails || isHovered"
      :class="{ 'floating-popup': !main.showDetails && isHovered }"
    >
      <li v-for="child in issue.children" :key="child.number">
        <svg
          v-if="child.state === 'closed'"
          focusable="false"
          aria-label="Completed"
          class="closed"
          role="img"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
          display="inline-block"
          overflow="visible"
          style="vertical-align: text-bottom"
        >
          <path
            d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"
          ></path>
          <path
            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"
          ></path>
        </svg>
        <svg
          v-else
          focusable="false"
          aria-label="Open"
          class="open"
          role="img"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
          display="inline-block"
          overflow="visible"
          style="vertical-align: text-bottom"
        >
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
          <path
            d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
          ></path>
        </svg>
        {{ child.title }}
        <a target="_blank" :href="`${repoUrl}/issues/${child.number}`"
          >#{{ child.number }}</a
        >
      </li>
    </ul>
  </div>
</template>
<script>
import { computed, ref } from "vue";
import { main } from "../main.js";
import { toRepo } from "../filters.js";

function getIssue(repo, args) {
  const issues = repo.issues?.data || {};
  for (const issueNumber in issues) {
    const issue = issues[issueNumber];
    if (issue.title.includes(args.title)) {
      return issue;
    }
  }
  return null;
}

export default {
  props: {
    repo: Object,
    args: Object,
  },
  title: "Display",
  check: async () => {},

  sortValue(repo, args) {
    return getIssue(repo, args);
  },
  total(repos, args) {
    return "";
  },
  setup(props) {
    const isHovered = ref(false);
    const issue = computed(() => {
      const issue = getIssue(props.repo, props.args);
      const children = Object.values(props.repo.issues?.data || {}).filter(
        (i) => i.parent === (issue ? issue.number : null)
      );
      const stats = children.reduce(
        (stats, child) => {
          if (child.state === "closed") {
            stats.closed++;
          }
          stats.total++;
          return stats;
        },
        { total: 0, closed: 0 }
      );
      return {
        ...issue,
        children,
        stats,
      };
    });
    return {
      props,
      issue,
      main,
      repoUrl: computed(() => toRepo(props.repo.name)),
      isHovered,
    };
  },
};
</script>
<style scoped>
.closed {
  color: #8250df;
}
.open {
  color: #1a7f37;
}
.floating-popup {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  padding: 10px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  list-style: none;
  min-width: 200px;
  left: 0;
  top: 100%;
}
</style>
