<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import { getRepositoryCommits } from "../api/githubApi";

import type {
    GithubCommit,
    GithubRepository,
} from "../types/github";

type GroupingPeriod = "day" | "week" | "month";

type CommitActivityPoint = {
    timestamp: number;
    count: number;
};

const props = defineProps<{
    owner: string;
    repositories: GithubRepository[];
}>();

const selectedRepository = ref("");
const groupingPeriod = ref<GroupingPeriod>("day");

const commits = ref<GithubCommit[]>([]);
const loading = ref(false);
const errorMessage = ref("");

watch(
    () => props.repositories,
    (repositories) => {
        const repositoryStillExists = repositories.some(
            (repository) =>
                repository.name === selectedRepository.value,
        );

        if (!repositoryStillExists) {
            selectedRepository.value = "";
            commits.value = [];
        }
    },
);

function getCommitDate(commit: GithubCommit): Date | null {
    const dateString =
        commit.commit.author?.date ??
        commit.commit.committer?.date;

    if (!dateString) {
        return null;
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function getStartOfDay(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
        ),
    );
}

function getStartOfWeek(date: Date): Date {
    const startOfDay = getStartOfDay(date);

    const dayOfWeek = startOfDay.getUTCDay();

    const daysSinceMonday =
        dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    startOfDay.setUTCDate(
        startOfDay.getUTCDate() - daysSinceMonday,
    );

    return startOfDay;
}

function getStartOfMonth(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            1,
        ),
    );
}

function getPeriodStart(
    date: Date,
    period: GroupingPeriod,
): Date {
    switch (period) {
        case "week":
            return getStartOfWeek(date);

        case "month":
            return getStartOfMonth(date);

        case "day":
        default:
            return getStartOfDay(date);
    }
}

const commitActivity = computed<CommitActivityPoint[]>(() => {
    const commitCounts = new Map<number, number>();

    for (const commit of commits.value) {
        const commitDate = getCommitDate(commit);

        if (!commitDate) {
            continue;
        }

        const periodStart = getPeriodStart(
            commitDate,
            groupingPeriod.value,
        );

        const timestamp = periodStart.getTime();

        commitCounts.set(
            timestamp,
            (commitCounts.get(timestamp) ?? 0) + 1,
        );
    }

    return Array.from(commitCounts.entries())
        .map(([timestamp, count]) => ({
            timestamp,
            count,
        }))
        .sort(
            (firstPoint, secondPoint) =>
                firstPoint.timestamp - secondPoint.timestamp,
        );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "area",
        backgroundColor: "#121212",
        zooming: {
            type: "x",
        },
    },

    title: {
        text: "Commit Activity Over Time",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: selectedRepository.value
            ? `${selectedRepository.value} · grouped by ${groupingPeriod.value}`
            : "Select a repository to load commit activity",
        style: {
            color: "#cccccc",
        },
    },

    xAxis: {
        type: "datetime",

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
            text: "Commits",
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
        xDateFormat:
            groupingPeriod.value === "month"
                ? "%B %Y"
                : "%e %B %Y",

        pointFormat: "<b>{point.y}</b> commits",
    },

    plotOptions: {
        area: {
            marker: {
                enabled: commitActivity.value.length <= 40,
                radius: 3,
            },

            lineWidth: 2,

            fillOpacity: 0.25,

            states: {
                hover: {
                    lineWidth: 3,
                },
            },
        },
    },

    series: [
        {
            type: "area",
            name: "Commits",

            data: commitActivity.value.map((point) => [
                point.timestamp,
                point.count,
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

async function loadCommits(): Promise<void> {
    if (!selectedRepository.value || !props.owner) {
        return;
    }

    loading.value = true;
    errorMessage.value = "";
    commits.value = [];

    try {
        commits.value = await getRepositoryCommits(
            props.owner,
            selectedRepository.value,
        );
    } catch (error: unknown) {
        errorMessage.value =
            error instanceof Error
                ? error.message
                : "Could not load repository commits.";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <section class="dashboard-card commit-activity-card">
        <div class="chart-controls">
            <label>
                Repository

                <select v-model="selectedRepository">
                    <option value="">
                        Select a repository
                    </option>

                    <option
                        v-for="repository in repositories"
                        :key="repository.id"
                        :value="repository.name"
                    >
                        {{ repository.name }}
                    </option>
                </select>
            </label>

            <label>
                Group commits by

                <select v-model="groupingPeriod">
                    <option value="day">
                        Day
                    </option>

                    <option value="week">
                        Week
                    </option>

                    <option value="month">
                        Month
                    </option>
                </select>
            </label>

            <button
                type="button"
                :disabled="!selectedRepository || loading"
                @click="loadCommits"
            >
                {{ loading ? "Loading..." : "Load activity" }}
            </button>
        </div>

        <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
        </p>

        <p v-else-if="loading" class="loading-message">
            Loading commits from GitHub...
        </p>

        <Chart
            v-else-if="commitActivity.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p
            v-else-if="selectedRepository && commits.length === 0"
            class="empty-chart-message"
        >
            Load the repository to display its commit activity.
        </p>

        <p v-else class="empty-chart-message">
            Select a repository to display commit activity.
        </p>
    </section>
</template>