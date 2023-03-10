import { createRouter, createWebHistory } from "vue-router";
import ChecksView from "../views/ChecksView.vue";
import CreateIssues from "../views/CreateIssues.vue";
import PreviewView from "../views/PreviewView.vue";
import RepoCreationChart from "../components/RepoCreationChart.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "checks",
      component: ChecksView,
    },
    {
      path: "/preview",
      name: "preview",
      component: PreviewView,
    },
    {
      path: "/evals",
      name: "evals",
      component: CreateIssues,
    },
    {
      path: "/chart",
      name: "chart",
      component: RepoCreationChart,
    },
  ],
});

export default router;
