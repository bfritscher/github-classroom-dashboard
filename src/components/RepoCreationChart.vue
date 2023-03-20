<template>
  <ChartJSLine :data="chartData" :options="chartOptions" />
</template>
<script>
import "chartjs-adapter-date-fns";
import { Line as ChartJSLine } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
  LinearScale
);

import { main } from "../main.js";
import { githubUsernameLookup } from "../api.js";
import { school_domain_colors } from "../colors.js";

function extractDomain(email) {
  if (email) {
    return email.split("@")[1];
  }
  return "unknown";
}

export default {
  name: "BarChart",
  components: { ChartJSLine },
  computed: {
    totalPerDomain() {
      const totalPerDomain = Object.values(githubUsernameLookup).reduce(
        (acc, value) => {
          value = extractDomain(value);
          if (!acc[value]) {
            acc[value] = 0;
          }
          acc[value]++;
          return acc;
        },
        {}
      );
      totalPerDomain["total"] = Object.values(totalPerDomain).reduce(
        (acc, value) => acc + value,
        0
      );
      return totalPerDomain;
    },
    sortedAssignments() {
      return Object.values(main.assignments).sort((a, b) => {
        return a.created_at.localeCompare(b.created_at);
      });
    },
    chartData() {
      const cumSum = Object.keys(this.totalPerDomain).reduce((acc, domain) => {
        acc[domain] = 0;
        return acc;
      }, {});

      const delta = { ...cumSum };

      const datasets = Object.keys(this.totalPerDomain).reduce(
        (acc, domain) => {
          acc[domain] = {
            label: `${domain} (${this.totalPerDomain[domain]})`,
            backgroundColor: school_domain_colors[domain],
            borderColor: school_domain_colors[domain],
            data: [],
          };
          return acc;
        },
        {}
      );
      let last_date;

      const truncateDate = (date) => {
        return date.split(":")[0] + ":00:00Z";
      };

      const addDataPoint = (domain) => {
        datasets[domain].data.push({
          x: last_date,
          y: (cumSum[domain] / this.totalPerDomain[domain]) * 100,
          cumSum: cumSum[domain],
          delta: delta[domain],
        });
        delta[domain] = 0;
      };

      let domain;
      this.sortedAssignments.forEach((assignment) => {
        if (
          truncateDate(assignment.created_at) !== last_date &&
          last_date !== undefined
        ) {
          Object.keys(this.totalPerDomain).forEach((domain) => {
            addDataPoint(domain);
          });
        }
        domain = extractDomain(githubUsernameLookup[assignment.users[0].login]);
        last_date = truncateDate(assignment.created_at);
        cumSum["total"] += 1;
        delta["total"] += 1;
        cumSum[domain] += 1;
        delta[domain] += 1;
      });
      Object.keys(this.totalPerDomain).forEach((domain) => {
        addDataPoint(domain);
      });

      return {
        datasets: Object.values(datasets),
      };
    },
    chartOptions() {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Percentage of students who created a repo per domain",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";

                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2) + "%";
                  label += ` (Δ ${context.raw.delta}, n: ${context.raw.cumSum}) `;
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date / Time",
            },
            type: "time",
            time: {
              round: "hour",
              unit: "hour",
              displayFormats: {
                millisecond: "HH:mm:ss.SSS",
                second: "HH:mm:ss",
                minute: "HH:mm",
                hour: "dd.MM HH:mm",
              },
            },
            max:
              this.totalPerDomain["total"] === this.sortedAssignments.length
                ? new Date(
                    this.sortedAssignments[
                      this.sortedAssignments.length - 1
                    ].created_at
                  )
                : new Date().setHours(new Date().getHours() + 2),
          },
          y: {
            title: {
              display: true,
              text: "Percentage of total students",
            },
            min: 0,
            max: 110,
          },
        },
      };
    },
  },
};
</script>
