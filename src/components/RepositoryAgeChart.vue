<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

type RepositoryAgeData = {
    name: string;
    ageInMonths: number;
    createdAt: string;
    url: string;
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

function calculateAgeInMonths(
    createdAt: string,
    currentDate: Date,
): number | null {
    const createdDate = new Date(createdAt);

    if (Number.isNaN(createdDate.getTime())) {
        return null;
    }

    let months =
        (currentDate.getUTCFullYear() -
            createdDate.getUTCFullYear()) *
            12 +
        (currentDate.getUTCMonth() -
            createdDate.getUTCMonth());

    if (currentDate.getUTCDate() < createdDate.getUTCDate()) {
        months -= 1;
    }

    return Math.max(0, months);
}

function formatRepositoryAge(ageInMonths: number): string {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years === 0) {
        return `${months} ${months === 1 ? "month" : "months"}`;
    }

    if (months === 0) {
        return `${years} ${years === 1 ? "year" : "years"}`;
    }

    return `${years} ${years === 1 ? "year" : "years"}, ${months} ${
        months === 1 ? "month" : "months"
    }`;
}

function formatCreationDate(createdAt: string): string {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

const repositoryAgeData = computed<RepositoryAgeData[]>(() => {
    const currentDate = new Date();

    return props.repositories
        .map((repository) => {
            const ageInMonths = calculateAgeInMonths(
                repository.created_at,
                currentDate,
            );

            if (ageInMonths === null) {
                return null;
            }

            return {
                name: repository.name,
                ageInMonths,
                createdAt: repository.created_at,
                url: repository.html_url,
            };
        })
        .filter(
            (
                repository,
            ): repository is RepositoryAgeData =>
                repository !== null,
        )
        .sort(
            (firstRepository, secondRepository) =>
                secondRepository.ageInMonths -
                firstRepository.ageInMonths,
        )
        .slice(0, 10);
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
        height: Math.max(
            380,
            repositoryAgeData.value.length * 52 + 150,
        ),
    },

    title: {
        text: "Repository Age",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: "The 10 oldest public repositories",
        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A horizontal bar chart comparing repository age in months.",
    },

    xAxis: {
        categories: repositoryAgeData.value.map(
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
            text: "Age in months",
            style: {
                color: "#cccccc",
            },
        },

        labels: {
            formatter() {
                const months = Number(this.value);
                const years = months / 12;

                if (months >= 12) {
                    return `${years.toFixed(
                        Number.isInteger(years) ? 0 : 1,
                    )}y`;
                }

                return `${months}m`;
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
                      createdAt?: string;
                  }
                | undefined;

            const repositoryName =
                custom?.repositoryName ?? "Unknown repository";

            const ageInMonths =
                typeof this.y === "number" ? this.y : 0;

            const createdAt = custom?.createdAt
                ? formatCreationDate(custom.createdAt)
                : "Unknown date";

            return `
                <b>${repositoryName}</b>
                <br>
                Age: ${formatRepositoryAge(ageInMonths)}
                <br>
                Created: ${createdAt}
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
                    const ageInMonths =
                        typeof this.y === "number"
                            ? this.y
                            : 0;

                    return formatRepositoryAge(ageInMonths);
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
            name: "Repository age",

            data: repositoryAgeData.value.map(
                (repository) => ({
                    y: repository.ageInMonths,

                    custom: {
                        repositoryName: repository.name,
                        createdAt: repository.createdAt,
                        url: repository.url,
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
            v-if="repositoryAgeData.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No valid repository creation dates are available.
        </p>
    </section>
</template>