export let GITHUB_ORG = "heg-web";
export const API = "https://api.github.com/";
export const CUSTOM_SEARCH_API = "https://pweb.bf0.ch/api/";
export const USERNAME_BLACKLIST = [
  "heg-web-bot",
  "bfritscher",
  "rolfgeneve",
  "JeromeHumbert",
  "Cotting",
  "solution",
  "template",
  "bryan-spahr",
  "schumachm",
];
export function setGithubOrg(org) {
  GITHUB_ORG = org;
}
