import { createApp, reactive } from "vue";

// global app state
export const main = reactive({
  ghApi: {
    rateLimitQueue: [],
    rateLimit: {
      remaining: 0,
      limit: 0,
      reset: 0,
      resetCoutdown() {
        return Math.max(
          0,
          Math.round(
            (main.ghApi.rateLimit.reset * 1000 - new Date().getTime()) /
              (60 * 1000)
          )
        );
      },
    },
  },
  showDetails: false,
  showSearch: false,
  showPic: false,
  showCards: false,
  assignments: {},
  commits: [],
  commiterIndex: [],
});

import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

const app = createApp(App);
app.use(router);
app.mount("#app");
