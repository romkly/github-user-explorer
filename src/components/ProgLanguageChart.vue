<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";

import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

const props = defineProps<{
    repositories: GithubRepository[];
}>();

const languageData = computed(() => {
    const languageCounts = new Map<string, number>();

    for(const repository of props.repositories) {
        const language = repository.language ?? "Unknown";
        const currentCount = languageCounts.get(language) ?? 0;

        languageCounts.set(language, currentCount + 1);
    }

    return Array.from(languageCounts.entries())
        .map(([name, count]) => ({
            name, 
            y: count
        }));
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "pie",
    },

    title: {
        text: "Used Programming Languages",
    },

    subtitle: {
        text: "Based on each repository's primary language",
    },

    tooltip: {
        pointFormat: `
            <b>{point.y}</b> repositories
            <br>
            <b>{point.percentage:.1f}%</b>
        `,
    },

    plotOptions:{
        pie: {
            innerSize: "55%",
            allowPointSelect: true,
            cursor: "pointer",

            dataLabels: {
                enabled: true,
                format: "{point.name}: {point.y}",
            },
        },
    },

    series: [{
        type: "pie",
        name: "Repositories",
        data: languageData.value,
    }],

    credits: {
        enabled: false,
    },
}));
</script>

<template>
    <section class="dashboard-card">
        <Chart
            v-if="languageData.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository language data is available.
        </p>
    </section>
</template>