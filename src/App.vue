<script setup>
import axios from "axios";
import { main } from "./main.js";
import {
  store,
  avatars,
  logout,
  loadCourseById,
  addAssignment,
  loadAssignmentById,
} from "./appwrite.js";

let interval = undefined;

function startRateInterval() {
  if (interval) return;
  const func = () => {
    const req = main.ghApi.rateLimitQueue.shift();
    if (req) {
      req.resolve(req.config);
    } else {
      clearRateInterval();
    }
  };

  func();
  interval = setInterval(func, 6200);
}

function clearRateInterval() {
  if (interval) clearInterval(interval);
  interval = undefined;
}

axios.interceptors.request.use((config) => {
  if (store.session?.providerAccessToken) {
    config.headers.authorization = "token " + store.session.providerAccessToken;
  }
  if (config.url.includes("search/code") && config.url.includes("github")) {
    const promise = new Promise((resolve) => {
      main.ghApi.rateLimitQueue.push({
        config,
        resolve,
      });
      startRateInterval();
    });

    return promise;
  }

  return config;
});

axios.interceptors.response.use((response) => {
  if (response.headers) {
    if (
      Object.prototype.hasOwnProperty.call(
        response.headers,
        "x-ratelimit-remaining"
      )
    ) {
      main.ghApi.rateLimit.remaining = parseInt(
        response.headers["x-ratelimit-remaining"],
        10
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(
        response.headers,
        "x-ratelimit-limit"
      )
    ) {
      main.ghApi.rateLimit.limit = parseInt(
        response.headers["x-ratelimit-limit"],
        10
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(
        response.headers,
        "x-ratelimit-reset"
      )
    ) {
      main.ghApi.rateLimit.reset = parseInt(
        response.headers["x-ratelimit-reset"],
        10
      );
    }
  }
  return response;
});
</script>

<template>
  <header>
    <nav>
      <h1>Github Classroom Dashboard</h1>
      <select @change="(event) => loadCourseById(event.target.value)">
        <option></option>
        <option
          v-for="c in store.courses"
          :key="c.$id"
          :value="c.$id"
          :selected="store.course?.$id == c.$id"
        >
          {{ c.year }} {{ c.name }} {{ c.class }}
        </option>
      </select>
      <select
        v-if="store.course"
        @change="(event) => loadAssignmentById(event.target.value)"
      >
        <option
          v-for="a in store.course.assignments"
          :key="a.$id"
          :value="a.$id"
          :selected="store.assignment?.$id == a.$id"
        >
          {{ a.name }}
        </option>
      </select>
      <a @click="addAssignment()">+</a>
      <router-link to="/">Checks</router-link>
      <router-link to="/search">Search</router-link>
      <router-link to="/preview">Preview</router-link>
      <router-link to="/chart">Chart</router-link>
      <router-link to="/evals">Upload Issues</router-link>
      <span class="spacer"></span>
      <router-link v-if="store.account" to="/login" @click="logout()">
        <img class="avatar" :src="avatars.getInitials(store.account.name)" />
        logout</router-link
      >
    </nav>
  </header>
  <main>
    <router-view></router-view>
  </main>
</template>

<style>
body {
  font-family: Lato, sans-serif;
  color: #4c5773;
  font-size: 14px;
  margin: 0;
}

h1 {
  margin: 4px 8px 0 8px;
  font-size: 16px;
}

h2 {
  margin: 4px 4px;
}

nav {
  display: flex;
  padding-top: 4px;
  padding-bottom: 4px;
}

nav a {
  margin: 0 4px;
  font-size: 14px;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

a {
  text-decoration: none;
  color: #509ee3;
}

nav a:hover {
  color: #ffffff;
  background-color: #509ee3;
}

a.router-link-exact-active {
  color: #ffffff;
  background: #509ee3;
}

label {
  cursor: pointer;
}

button,
.btn {
  color: #ffffff;
  background: #509ee3;
  border: 1px solid #509ee3;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  display: inline-block;
  box-sizing: border-box;
  text-decoration: none;
  cursor: pointer;
}

.spacer {
  flex: 1;
}

.submenu {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  background-color: #f5f9fc;
  padding: 4px;
  align-items: center;
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

li {
  white-space: nowrap;
}

.text-nowrap {
  white-space: nowrap;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.flex {
  flex: 1;
}

.row {
  display: flex;
}

.col-6 {
  width: 50%;
}

.pa-3 {
  margin: 2rem;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
</style>
