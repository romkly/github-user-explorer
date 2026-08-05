<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

const props = defineProps<{
    repositories: GithubRepository[];
}>();

type RepositoryStarData = {
    name: string;
    stars: number;
    url: string;
};

const topRepositories = computed<RepositoryStarData[]>(() => {
    return [...props.repositories]
        .filter((repository) => repository.stargazers_count > 0)
        .sort(
            (firstRepository, secondRepository) =>
                secondRepository.stargazers_count -
                firstRepository.stargazers_count,
        )
        .slice(0, 10)
        .map((repository) => ({
            name: repository.name,
            stars: repository.stargazers_count,
            url: repository.html_url,
        }));
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
    },

    title: {
        text: "Top Repositories by Stars",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: "The developer’s most-starred public repositories",
        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A horizontal bar chart ranking the developer's public repositories by GitHub stars.",
    },

    xAxis: {
        categories: topRepositories.value.map(
            (repository) => repository.name,
        ),

        title: {
            text: undefined,
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
            text: "Stars",
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
        pointFormat: "<b>{point.y}</b> stars",
    },

    plotOptions: {
        bar: {
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

        series: {
            cursor: "pointer",

            point: {
                events: {
                    click(event) {
                        const repository =
                            topRepositories.value[event.point.index];

                        if (!repository) {
                            return;
                        }

                        window.open(
                            repository.url,
                            "_blank",
                            "noopener,noreferrer",
                        );
                    },
                },
            },
        },
    },

    series: [
        {
            type: "bar",
            name: "Stars",
            data: topRepositories.value.map(
                (repository) => repository.stars,
            ),
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
            v-if="topRepositories.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            This user has no starred public repositories.
        </p>
    </section>
</template>