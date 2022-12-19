<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
<script>
import "chartjs-adapter-date-fns";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Legend,
  BarElement,
  TimeScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Legend, BarElement, TimeScale, LinearScale);

import { committer_colors } from "../colors.js";

export default {
  name: "BarChart",
  components: { Bar },
  props: ["commits"],
  computed: {
    chartData() {
      const grouped = this.commits.reduce((acc, commit) => {
        const key = commit.commit.author.name;
        if (key === "github-classroom[bot]") {
          return acc;
        }
        if (!acc[key]) {
          acc[key] = {};
        }
        const day = commit.commit.author.date.split("T")[0];
        if (!acc[key][day]) {
          acc[key][day] = 0;
        }
        acc[key][day]++;
        return acc;
      }, {});
      return {
        datasets: Object.keys(grouped).map((author, i) => {
          return {
            label: author,
            backgroundColor: committer_colors[i],
            data: Object.keys(grouped[author]).map((day) => {
              return {
                x: new Date(day),
                y: grouped[author][day],
              };
            }),
          };
        }),
      };
    },
    chartOptions() {
      return {
        responsive: true,
        scales: {
          x: {
            type: "time",
            time: {
              round: "day",
              unit: "day",
            },
            stacked: true,
            max: new Date(),
          },
          y: {
            stacked: true,
            ticks: {
              precision: 0,
            },
          },
        },
      };
    },
  },
};
</script>
