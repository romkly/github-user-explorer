<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

type MonthlyRepositoryData = {
    timestamp: number;
    count: number;
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

function getStartOfUtcMonth(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            1,
        ),
    );
}

function addUtcMonths(date: Date, months: number): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth() + months,
            1,
        ),
    );
}

function createMonthKey(date: Date): string {
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
    ].join("-");
}

const repositoryCreationTimeline = computed<
    MonthlyRepositoryData[]
>(() => {
    const validCreationDates = props.repositories
        .map((repository) => new Date(repository.created_at))
        .filter((date) => !Number.isNaN(date.getTime()));

    if (validCreationDates.length === 0) {
        return [];
    }

    const repositoriesByMonth = new Map<string, number>();

    for (const creationDate of validCreationDates) {
        const monthStart = getStartOfUtcMonth(creationDate);
        const monthKey = createMonthKey(monthStart);

        repositoriesByMonth.set(
            monthKey,
            (repositoriesByMonth.get(monthKey) ?? 0) + 1,
        );
    }

    const earliestDate = new Date(
        Math.min(
            ...validCreationDates.map((date) => date.getTime()),
        ),
    );

    const currentDate = new Date();

    const firstMonth = getStartOfUtcMonth(earliestDate);
    const lastMonth = getStartOfUtcMonth(currentDate);

    const result: MonthlyRepositoryData[] = [];

    let currentMonth = firstMonth;

    while (currentMonth.getTime() <= lastMonth.getTime()) {
        const monthKey = createMonthKey(currentMonth);

        result.push({
            timestamp: currentMonth.getTime(),
            count: repositoriesByMonth.get(monthKey) ?? 0,
        });

        currentMonth = addUtcMonths(currentMonth, 1);
    }

    return result;
});

const totalCreatedRepositories = computed(() => {
    return repositoryCreationTimeline.value.reduce(
        (total, month) => total + month.count,
        0,
    );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "line",
        backgroundColor: "#121212",
        zooming: {
            type: "x",
        },
    },

    title: {
        text: "Repository Creation Timeline",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: `${totalCreatedRepositories.value} public repositories grouped by creation month`,
        style: {
            color: "#cccccc",
        },
    },

    xAxis: {
        type: "datetime",

        title: {
            text: "Creation month",
            style: {
                color: "#cccccc",
            },
        },

        labels: {
            format: "{value:%b %Y}",

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

        gridLineColor: "#333333",
    },

    tooltip: {
        xDateFormat: "%B %Y",
        pointFormat: "<b>{point.y}</b> repositories created",
    },

    plotOptions: {
        line: {
            lineWidth: 3,

            marker: {
                enabled:
                    repositoryCreationTimeline.value.length <= 36,
                radius: 4,
            },

            dataLabels: {
                enabled: true,

                formatter() {
                    return typeof this.y === "number" && this.y > 0
                        ? this.y.toString()
                        : "";
                },

                style: {
                    color: "#ffffff",
                    textOutline: "none",
                },
            },
        },
    },

    series: [
        {
            type: "line",
            name: "Repositories created",

            data: repositoryCreationTimeline.value.map((month) => [
                month.timestamp,
                month.count,
            ]),
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
    <section class="dashboard-card repository-timeline-card">
        <Chart
            v-if="repositoryCreationTimeline.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No valid repository creation dates are available.
        </p>
    </section>
</template>