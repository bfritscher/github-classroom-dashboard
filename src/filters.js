import { GITHUB_ORG, API } from "./config";
export function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
}

export function repoToGhPagesUrl(repo) {
  return `https://${GITHUB_ORG}.github.io/${repo}`;
}

export function toRepoAPI(name) {
  return `${API}repos/${GITHUB_ORG}/${name}`;
}
