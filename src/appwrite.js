import {
  Client,
  Account,
  Databases,
  Teams,
  Avatars,
  Storage,
  Query,
} from "appwrite";
import { reactive } from "vue";
import { setGithubOrg } from "./config.js";
import { parseRoster } from "./api.js";

export const client = new Client()
  .setEndpoint("https://appwrite.bf0.ch/v1")
  .setProject("github-classroom-dashboard");

export const accountClient = new Account(client);
export const databases = new Databases(client);
export const teams = new Teams(client);
export const avatars = new Avatars(client);
export const storage = new Storage(client);

export const store = reactive({
  account: undefined,
  session: undefined,
  courses: [],
  course: undefined,
});

export function loginGithub() {
  accountClient.createOAuth2Session(
    "github",
    window.location.href,
    window.location.href,
    ["read:org", "repo"]
  );
}

export async function fetchAccount() {
  try {
    store.session = await accountClient.getSession("current");
    store.account = await accountClient.get();
    store.courses = (
      await databases.listDocuments("production", "courses", [
        Query.select(["year", "class", "name"]),
        Query.orderDesc("year"),
        Query.orderAsc("name"),
      ])
    ).documents;
    // TODO select last selected from localstorage
    if (store.courses.length > 0) {
      loadCourseById(store.courses[0].$id);
    }
    return true;
  } catch (e) {
    console.error("Error getting Account");
  }
  return;
}

export async function logout() {
  try {
    await accountClient.deleteSessions();
    store.account = undefined;
    store.session = undefined;
  } catch (e) {
    console.error("Error deleting Session", e);
  }
}

export async function loadCourseById(id) {
  store.course = await databases.getDocument("production", "courses", id);
  setGithubOrg(store.course.github_org);
  parseRoster(store.course.roster);
}
