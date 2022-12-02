import axios from "axios";
import Papa from "papaparse";
import { reactive } from "vue";
import { API } from "./config.js";

const githubUserCache = {};

export const githubUsernameLookup = reactive({});
export const githubUsernameLookupPics = reactive({});

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
    axios.get("/students.json").then((response) => {
      const students = response.data;
      results.data.forEach((e) => {
        const student = students.find(
          (s) =>
            e.identifier.includes(s.lastname) &&
            e.identifier.includes(s.firstname)
        );
        if (student) {
          githubUsernameLookupPics[e.github_username] = student;
        }
      });
    });
  },
});
