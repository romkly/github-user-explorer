<script setup lang="ts">
import { computed } from "vue";
import type { Options, SeriesColumnOptions } from "highcharts";
import { Chart } from "highcharts-vue";
import Highcharts from "highcharts";

import type { GithubRepository } from "../types/github";

type YearLanguageCounts = Map<number, Map<string, number>>;

const props = defineProps<{
    repositories: GithubRepository[];
}>();

const MAX_LANGUAGES = 8;

function getCreationYear(repository: GithubRepository): number | null {
    const createdDate = new Date(repository.created_at);

    if (Number.isNaN(createdDate.getTime())) {
        return null;
    }

    return createdDate.getUTCFullYear();
}

const languageTotals = computed(() => {
    const totals = new Map<string, number>();

    for (const repository of props.repositories) {
        const language = repository.language;

        if (!language) {
            continue;
        }

        totals.set(
            language,
            (totals.get(language) ?? 0) + 1,
        );
    }

    return totals;
});

const mainLanguages = computed(() => {
    return [...languageTotals.value.entries()]
        .sort(
            (firstLanguage, secondLanguage) =>
                secondLanguage[1] - firstLanguage[1],
        )
        .slice(0, MAX_LANGUAGES)
        .map(([language]) => language);
});

const languageEvolution = computed<YearLanguageCounts>(() => {
    const countsByYear: YearLanguageCounts = new Map();

    for (const repository of props.repositories) {
        const year = getCreationYear(repository);
        const repositoryLanguage = repository.language;

        if (year === null || !repositoryLanguage) {
            continue;
        }

        const language = mainLanguages.value.includes(
            repositoryLanguage,
        )
            ? repositoryLanguage
            : "Other";

        const yearCounts =
            countsByYear.get(year) ?? new Map<string, number>();

        yearCounts.set(
            language,
            (yearCounts.get(language) ?? 0) + 1,
        );

        countsByYear.set(year, yearCounts);
    }

    return countsByYear;
});

const years = computed(() => {
    return [...languageEvolution.value.keys()].sort(
        (firstYear, secondYear) => firstYear - secondYear,
    );
});

const displayedLanguages = computed(() => {
    const languages = [...mainLanguages.value];

    const hasOther = [...languageEvolution.value.values()].some(
        (yearCounts) => yearCounts.has("Other"),
    );

    if (hasOther) {
        languages.push("Other");
    }

    return languages;
});

const chartSeries = computed<SeriesColumnOptions[]>(() => {
    return displayedLanguages.value.map((language) => ({
        type: "column",
        name: language,

        data: years.value.map((year) => {
            const yearCounts = languageEvolution.value.get(year);

            return yearCounts?.get(language) ?? 0;
        }),
    }));
});

const totalRepositoriesWithLanguage = computed(() => {
    return [...languageEvolution.value.values()].reduce(
        (total, yearCounts) => {
            return (
                total +
                [...yearCounts.values()].reduce(
                    (yearTotal, count) => yearTotal + count,
                    0,
                )
            );
        },
        0,
    );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "column",
        backgroundColor: "#121212",
    },

    title: {
        text: "Programming Language Evolution",

        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: `${totalRepositoriesWithLanguage.value} repositories grouped by creation year and primary language`,

        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A stacked column chart showing the primary programming languages of repositories grouped by repository creation year.",
    },

    xAxis: {
        categories: years.value.map(String),

        title: {
            text: "Repository creation year",

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
            text: "Repositories created",

            style: {
                color: "#cccccc",
            },
        },

        labels: {
            style: {
                color: "#cccccc",
            },
        },

        stackLabels: {
            enabled: true,

            style: {
                color: "#ffffff",
                textOutline: "none",
            },
        },

        gridLineColor: "#333333",
    },

    tooltip: {
        shared: true,

        formatter() {
            const year =
                typeof this.x === "string" ||
                typeof this.x === "number"
                    ? this.x
                    : "Unknown year";

            const points = this.points ?? [];

            const rows = points
                .filter(
                    (point) =>
                        typeof point.y === "number" &&
                        point.y > 0,
                )
                .map((point) => {
                    const count =
                        typeof point.y === "number"
                            ? point.y
                            : 0;

                    return `
                        <br>
                        <span style="color:${point.color}">
                            ●
                        </span>
                        ${point.series.name}: <b>${count}</b>
                    `;
                })
                .join("");

            const total = points.reduce((sum, point) => {
                return (
                    sum +
                    (typeof point.y === "number"
                        ? point.y
                        : 0)
                );
            }, 0);

            return `
                <b>${year}</b>
                ${rows}
                <br>
                Total: <b>${total}</b>
            `;
        },
    },

    plotOptions: {
        column: {
            stacking: "normal",
            borderWidth: 0,
            borderRadius: 2,

            dataLabels: {
                enabled: true,

                formatter() {
                    return typeof this.y === "number" &&
                        this.y > 0
                        ? this.y.toString()
                        : "";
                },

                style: {
                    color: "#ffffff",
                    textOutline: "none",
                    fontSize: "10px",
                },
            },
        },
    },

    series: chartSeries.value,

    legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",

        itemStyle: {
            color: "#cccccc",
        },

        itemHoverStyle: {
            color: "#ffffff",
        },

        itemHiddenStyle: {
            color: "#666666",
        },
    },

    credits: {
        enabled: false,
    },
}));
</script>

<template>
    <section class="dashboard-card language-evolution-card">
        <Chart
            v-if="years.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository language history is available.
        </p>
    </section>
</template>