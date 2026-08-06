<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

type RepositoryIssueData = {
    name: string;
    openIssues: number;
    url: string;
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

const repositoryIssueData = computed<RepositoryIssueData[]>(() => {
    return [...props.repositories]
        .filter(
            (repository) =>
                repository.open_issues_count > 0,
        )
        .sort(
            (firstRepository, secondRepository) =>
                secondRepository.open_issues_count -
                firstRepository.open_issues_count,
        )
        .slice(0, 10)
        .map((repository) => ({
            name: repository.name,
            openIssues: repository.open_issues_count,
            url: repository.html_url,
        }));
});

const totalOpenIssues = computed(() => {
    return repositoryIssueData.value.reduce(
        (total, repository) =>
            total + repository.openIssues,
        0,
    );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
        height: Math.max(
            380,
            repositoryIssueData.value.length * 52 + 150,
        ),
    },

    title: {
        text: "Open Issues by Repository",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: `${totalOpenIssues.value} open issues and pull requests across the displayed repositories`,
        style: {
            color: "#cccccc",
        },
    },

    xAxis: {
        categories: repositoryIssueData.value.map(
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
            text: "Open issues",
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
        formatter() {
            const custom = this.options.custom as
                | {
                      repositoryName?: string;
                  }
                | undefined;

            const repositoryName =
                custom?.repositoryName ??
                "Unknown repository";

            const openIssues =
                typeof this.y === "number"
                    ? this.y
                    : 0;

            return `
                <b>${repositoryName}</b>
                <br>
                ${openIssues}
                ${openIssues === 1 ? "open item" : "open items"}
                <br>
                <span style="color:#aaaaaa">
                    May include pull requests
                </span>
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
                    return typeof this.y === "number"
                        ? this.y.toString()
                        : "0";
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
                                  issuesUrl?: string;
                              }
                            | undefined;

                        if (!custom?.issuesUrl) {
                            return;
                        }

                        window.open(
                            custom.issuesUrl,
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
            name: "Open issues",

            data: repositoryIssueData.value.map(
                (repository) => ({
                    y: repository.openIssues,

                    custom: {
                        repositoryName: repository.name,
                        issuesUrl: `${repository.url}/issues`,
                    },
                }),
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
            v-if="repositoryIssueData.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            This user has no repositories with open issues.
        </p>
    </section>
</template>