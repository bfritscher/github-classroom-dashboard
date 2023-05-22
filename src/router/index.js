import { createRouter, createWebHashHistory } from "vue-router";
import ChecksView from "../views/ChecksView.vue";
import PreviewView from "../views/PreviewView.vue";
import SearchView from "../views/SearchView.vue";
import RepoCreationChart from "../components/RepoCreationChart.vue";
import Login from "../views/Login.vue";
import { fetchAccount, store } from "../appwrite.js";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "checks",
      component: ChecksView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/preview",
      name: "preview",
      component: PreviewView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/evals",
      name: "evals",
      component: () => import("../views/CreateIssues.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/chart",
      name: "chart",
      component: RepoCreationChart,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/search",
      name: "search",
      component: SearchView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (store.account || (await fetchAccount())) {
      next();
      return;
    } else {
      next("/login");
    }
  } else {
    next();
  }
});

export default router;
