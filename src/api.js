import axios from "axios";
import Papa from "papaparse";
import { API } from "./config.js";

const githubUserCache = {};
// TODO make it reactive
export const githubUsernameLookup = {};

export function addNameToUserFromGithub(user) {
  if (githubUserCache[user.login]) {
    user.name = githubUserCache[user.login];
    return;
  }
  axios.get(`${API}users/${user.login}`).then(
    (response) => {
      user.name = response.data.name;
      githubUserCache[user.login] = user.name;
    },
    () => {}
  );
}

Papa.parse("/classroom_roster.csv", {
  download: true,
  header: true,
  complete: (results) => {
    results.data.forEach((e) => {
      githubUsernameLookup[e.github_username] = e.identifier;
    });
  },
});
