export let GITHUB_ORG = "heg-web";
export const API = "https://api.github.com/";
export const USERNAME_BLACKLIST = [
  "heg-web-bot",
  "bfritscher",
  "rolfgeneve",
  "JeromeHumbert",
  "Cotting",
  "solution",
  "template",
];
export function setGithubOrg(org) {
  GITHUB_ORG = org;
}
