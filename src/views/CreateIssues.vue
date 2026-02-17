<script setup>
import axios from "axios";
import Papa from "papaparse";
import { marked } from "marked";
import { API, GITHUB_ORG } from "../config.js";
import { reactive } from "vue";

const evalState = reactive({
  evals: [],
  evalsDone: [],
});

// ISSUE HANDLING
function createIssue() {
  const evaluation = evalState.evals.pop();
  if (evaluation) {
    const issue = {
      title: `Evaluation ${evaluation.repo}`,
      body: evaluation.md,
    };
    axios
      .post(
        API + "repos/" + GITHUB_ORG + "/" + evaluation.repo + "/issues",
        issue
      )
      .then(function (response) {
        evalState.evalsDone.push({
          repo: evaluation.repo,
          html_url: response.data.html_url,
        });
      })
      .catch((e) => {
        console.log(e);
      });
    setTimeout(createIssue, 1000);
  }
}

function toMD(fields, data) {
  // if any field includes {w:[floats]} enable flag
  const hasWeights = fields.some((f) => f.includes("{w:"));
  const isSectionHeader = (value) => /^\*[^*].*[^*]\*$/.test(value);

  let headers = `## Evaluation ${data.repo}\n\n| Critères | Points |`;
  if (hasWeights) {
    headers += " Coefficients |";
  }
  headers += "\n|---|---:|";
  if (hasWeights) {
    headers += "---:|";
  }
  headers += "\n";

  return fields.reduce((md, field) => {
    const value = (data[field] || "").trim();
    const fieldWithoutWeight = field.replace(/{w:[0-9.]+}/, "").trim();

    if (isSectionHeader(fieldWithoutWeight) && isNaN(field)) {
      const sectionLabel = fieldWithoutWeight.slice(1, -1).trim();
      md += `|<br>**${sectionLabel}** |  |`;
      if (hasWeights) {
        md += " |";
      }
      md += "\n";
      return md;
    }

    if (!isNaN(value) && isNaN(field) && value !== "") {
      if (field.startsWith("Note") || field.startsWith("Grade")) {
        md += `|**<br>${field}<br><br>** | **<br>${value}<br><br>**|`;
        if (hasWeights) {
          md += " |";
        }
        md += `\n`;
      } else {
        if (hasWeights) {
          const weightString = field.match(/{w:([0-9.]+)}/);
          let weight = "";
          if (weightString) {
            weight = parseFloat(weightString[1]);
          }
          const fieldStripped = field.replace(/{w:[0-9.]+}/, "");
          md += `|${fieldStripped} | ${value}| ${weight}|\n`;
        } else {
          md += `|${field} | ${value}|\n`;
        }
      }
    }
    if (
      (field === "Commentaires" || field === "Comment") &&
      value !== ""
    ) {
      md += `\n\n### ${field}\n${value}\n`;
    }
    return md;
  }, headers);
}

function parseCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const fields = results.meta.fields.filter((f) => f && !f.startsWith("_"));
      const evals = [];
      results.data.forEach((row) => {
        const md = toMD(fields, row);
        evals.push({
          repo: row.repo,
          md: md,
          preview: marked(md),
        });
      });
      evalState.evals = evals;
    },
  });
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  parseCSV(file);
}
</script>

<template>
  <div class="submenu">
    <p>
      <input type="file" @change="handleFileSelect" />
      <br />
      CSV file, first row: colum titles, columns starting with _ are ignored, a
      column named repo must exist, Comment or Commentaires will be displayed as text. 
      Field starting with Note or Grade will be displayed as bold.
      {w:x.z} is extracted from titles as weights. Columns with title *Section* create a separator row using that cell value.
    </p>
  </div>
  <div v-if="evalState.evals.length > 0 || evalState.evalsDone.length > 0">
    <h2>Upload Evaluations: {{ evalState.evals.length }}</h2>
    <div
      class="eval"
      v-for="ev in evalState.evals"
      v-html="ev.preview"
      :key="ev.repo"
    ></div>
    <div class="submenu">
      <button @click="createIssue()">Create Issues on GitHUB</button>
      <p>Done: {{ evalState.evalsDone.length }}</p>
    </div>
    <ul>
      <li v-for="done in evalState.evalsDone" :key="done.repo">
        <a :href="done.html_url">{{ done.repo }}</a>
      </li>
    </ul>
  </div>
</template>

<style>
.eval {
  border: 1px solid rgb(243 242 241);
  padding: 12px;
  border-radius: 6px;
  box-shadow: rgb(0 0 0 / 10%) 0px 4px 12px;
  max-width: 800px;
  margin: 20px auto;
}

.eval td {
  height: 1em;
}
</style>
