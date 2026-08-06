<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

type RepositorySizeData = {
    name: string;
    sizeKb: number;
    sizeMb: number;
    url: string;
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

const repositorySizeData = computed<RepositorySizeData[]>(() => {
    return [...props.repositories]
        .filter((repository) => repository.size > 0)
        .sort(
            (firstRepository, secondRepository) =>
                secondRepository.size - firstRepository.size,
        )
        .slice(0, 10)
        .map((repository) => ({
            name: repository.name,
            sizeKb: repository.size,
            sizeMb: repository.size / 1024,
            url: repository.html_url,
        }));
});

function formatFileSize(sizeKb: number): string {
    if (sizeKb >= 1024 * 1024) {
        return `${(sizeKb / 1024 / 1024).toFixed(2)} GB`;
    }

    if (sizeKb >= 1024) {
        return `${(sizeKb / 1024).toFixed(2)} MB`;
    }

    return `${sizeKb.toFixed(0)} KB`;
}

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
        height: Math.max(
            380,
            repositorySizeData.value.length * 52 + 150,
        ),
    },

    title: {
        text: "Repository Size Comparison",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: "Top 10 largest public repositories",
        style: {
            color: "#cccccc",
        },
    },

    xAxis: {
        categories: repositorySizeData.value.map(
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

        title: {
            text: "Repository size in MB",
            style: {
                color: "#cccccc",
            },
        },

        labels: {
            formatter() {
                return `${this.value} MB`;
            },

            style: {
                color: "#cccccc",
            },
        },

        gridLineColor: "#333333",
    },

    tooltip: {
        formatter() {
            const custom = this.options.custom as
                | {
                      repositoryName?: string;
                      sizeKb?: number;
                  }
                | undefined;

            const repositoryName =
                custom?.repositoryName ?? "Unknown repository";

            const sizeKb =
                typeof custom?.sizeKb === "number"
                    ? custom.sizeKb
                    : 0;

            return `
                <b>${repositoryName}</b>
                <br>
                ${formatFileSize(sizeKb)}
            `;
        },
    },

    plotOptions: {
        bar: {
            borderWidth: 0,
            borderRadius: 4,

            dataLabels: {
                enabled: true,

                formatter() {
                    return `${this.y?.toFixed(2) ?? 0} MB`;
                },

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
                    click() {
                        const custom = this.options.custom as
                            | {
                                  url?: string;
                              }
                            | undefined;

                        if (!custom?.url) {
                            return;
                        }

                        window.open(
                            custom.url,
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
            name: "Repository size",

            data: repositorySizeData.value.map((repository) => ({
                y: Number(repository.sizeMb.toFixed(2)),

                custom: {
                    repositoryName: repository.name,
                    sizeKb: repository.sizeKb,
                    url: repository.url,
                },
            })),
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
            v-if="repositorySizeData.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository size data is available.
        </p>
    </section>
</template>