import {
  Client,
  Account,
  Databases,
  Teams,
  Avatars,
  Storage,
  Query,
  ID,
} from "appwrite";
import { reactive } from "vue";
import { setGithubOrg } from "./config.js";
import { parseRoster } from "./api.js";
import { main } from "./main.js";

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
  assignment: undefined,
  preferences: {},
});

export function loginGithub() {
  accountClient.createOAuth2Session(
    "github",
    window.location.href,
    window.location.href,
    ["read:org", "repo", "project"]
  );
}

export async function fetchAccount() {
  try {
    store.session = await accountClient.getSession("current");
    store.account = await accountClient.get();
    store.courses = (
      await databases.listDocuments("production", "courses", [
        Query.select(["$id", "year", "class", "name"]),
        Query.orderDesc("year"),
        Query.orderAsc("name"),
      ])
    ).documents;
    store.preferences = (await accountClient.getPrefs()) || {};
    if (store.courses.length > 0) {
      if (store.preferences.lastCourse) {
        loadCourseById(store.preferences.lastCourse);
      } else {
        loadCourseById(store.courses[0].$id);
      }
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

export async function updatePreferences(changes) {
  store.preferences = Object.assign({}, store.preferences, changes);
  accountClient.updatePrefs(store.preferences);
}

export async function loadCourseById(id) {
  store.course = await databases.getDocument("production", "courses", id);
  setGithubOrg(store.course.github_org);
  parseRoster(store.course.roster);
  store.course.assignments = (
    await databases.listDocuments("production", "assignments", [
      Query.select(["$id", "name"]),
      Query.equal("course", [store.course.$id]),
      Query.orderAsc("name"),
    ])
  ).documents;
  store.assignment = undefined;
  updatePreferences({ lastCourse: store.course.$id });
  if (store.course.assignments.length > 0) {
    if (store.preferences[store.course.$id]) {
      loadAssignmentById(store.preferences[store.course.$id]);
    } else {
      loadAssignmentById(store.course.assignments[0].$id);
    }
  }
}

export async function addAssignment() {
  const name = prompt("Assignment Name");
  if (name) {
    const assignment = await databases.createDocument(
      "production",
      "assignments",
      ID.unique(),
      {
        name,
        course: store.course.$id,
      }
    );
    store.course.assignments.push(assignment);
    loadAssignmentById(assignment.$id);
  }
}

export async function loadAssignmentById(id) {
  store.assignment = await databases.getDocument(
    "production",
    "assignments",
    id
  );
  main.assignments = JSON.parse(store.assignment.data || "{}");
  const change = {};
  change[store.course.$id] = store.assignment.$id;
  updatePreferences(change);
}

export async function updateCurrentAssignment(changes) {
  store.assignment = await databases.updateDocument(
    "production",
    "assignments",
    store.assignment.$id,
    changes
  );
}
