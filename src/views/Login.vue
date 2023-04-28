<script setup>
import { watch } from "vue";
import { store, loginGithub, fetchAccount } from "../appwrite";
import { useRouter } from "vue-router";

const router = useRouter();
watch(
  () => store.session,
  () => {
    if (store.session?.providerAccessToken) {
      router.push("/");
    }
  }
);
// autologin
fetchAccount();
</script>
<template>
  <button class="btn" @click="loginGithub">Sign in with GitHub</button>
</template>
