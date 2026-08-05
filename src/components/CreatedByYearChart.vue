<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

const props = defineProps<{
    repositories: GithubRepository[];
}>();

type RepositoryYearData = {
    year: number;
    count: number;
};

const repositoriesByYear = computed<RepositoryYearData[]>(() => {
    const yearCounts = new Map<number, number>();

    for (const repository of props.repositories) {
        const createdDate = new Date(repository.created_at);

        if (Number.isNaN(createdDate.getTime())) {
            continue;
        }

        const year = createdDate.getFullYear();
        const currentCount = yearCounts.get(year) ?? 0;

        yearCounts.set(year, currentCount + 1);
    }

    return Array.from(yearCounts.entries())
        .map(([year, count]) => ({
            year,
            count,
        }))
        .sort((first, second) => first.year - second.year);
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "column",
        backgroundColor: "#121212",
    },

    title: {
        text: "Repositories Created by Year",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: "Number of public repositories created each year",
        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A column chart showing how many public repositories the developer created each year.",
    },

    xAxis: {
        categories: repositoriesByYear.value.map((item) =>
            item.year.toString(),
        ),

        title: {
            text: "Year",
            style: {
                color: "#cccccc",
            },
        },

        labels: {
            style: {
                color: "#cccccc",
            },
        },

        lineColor: "#555555",
        tickColor: "#555555",
    },

    yAxis: {
        min: 0,
        allowDecimals: false,

        title: {
            text: "Repositories",
            style: {
                color: "#cccccc",
            },
        },

        labels: {
            style: {
                color: "#cccccc",
            },
        },

        gridLineColor: "#333333",
    },

    tooltip: {
        pointFormat: "<b>{point.y}</b> repositories created",
    },

    plotOptions: {
        column: {
            borderWidth: 0,
            borderRadius: 4,

            dataLabels: {
                enabled: true,

                style: {
                    color: "#ffffff",
                    textOutline: "none",
                },
            },
        },
    },

    series: [
        {
            type: "column",
            name: "Repositories",
            data: repositoriesByYear.value.map((item) => item.count),
        },
    ],

    legend: {
        enabled: false,
    },

    credits: {
        enabled: false,
    },
}));
</script>

<template>
    <section class="dashboard-card">
        <Chart
            v-if="repositoriesByYear.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository creation data is available.
        </p>
    </section>
</template>