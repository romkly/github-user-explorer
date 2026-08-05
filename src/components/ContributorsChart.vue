<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import { getRepositoryContributors } from "../api/githubApi";

import type {
    GithubContributor,
    GithubRepository,
} from "../types/github";

type ContributorChartData = {
    login: string;
    contributions: number;
    profileUrl: string;
};

const props = defineProps<{
    owner: string;
    repositories: GithubRepository[];
}>();

const selectedRepository = ref("");
const contributors = ref<GithubContributor[]>([]);
const loading = ref(false);
const hasLoaded = ref(false);
const errorMessage = ref("");

watch(
    () => [props.owner, props.repositories] as const,
    () => {
        const repositoryStillExists = props.repositories.some(
            (repository) =>
                repository.name === selectedRepository.value,
        );

        if (!repositoryStillExists) {
            selectedRepository.value = "";
            contributors.value = [];
            hasLoaded.value = false;
            errorMessage.value = "";
        }
    },
);

const topContributors = computed<ContributorChartData[]>(() => {
    return [...contributors.value]
        .filter((contributor) => contributor.contributions > 0)
        .sort(
            (firstContributor, secondContributor) =>
                secondContributor.contributions -
                firstContributor.contributions,
        )
        .slice(0, 10)
        .map((contributor) => ({
            login: contributor.login,
            contributions: contributor.contributions,
            profileUrl: contributor.html_url,
        }));
});

const totalContributions = computed(() => {
    return contributors.value.reduce(
        (total, contributor) =>
            total + contributor.contributions,
        0,
    );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
        height: Math.max(
            360,
            topContributors.value.length * 52 + 150,
        ),
    },

    title: {
        text: "Top Contributors",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: selectedRepository.value
            ? `${selectedRepository.value} · ${totalContributions.value} total contributions`
            : "Select a repository",
        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A horizontal bar chart ranking contributors by their contribution count for the selected repository.",
    },

    xAxis: {
        categories: topContributors.value.map(
            (contributor) => contributor.login,
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
            text: "Contributions",
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
            const contributor =
                topContributors.value[this.index];

            if (!contributor) {
                return "";
            }

            const word =
                contributor.contributions === 1
                    ? "contribution"
                    : "contributions";

            return `
                <b>${contributor.login}</b>
                <br>
                ${contributor.contributions} ${word}
            `;
        },
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
                        const contributor =
                            topContributors.value[
                                event.point.index
                            ];

                        if (!contributor) {
                            return;
                        }

                        window.open(
                            contributor.profileUrl,
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
            name: "Contributions",

            data: topContributors.value.map(
                (contributor) =>
                    contributor.contributions,
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

async function loadContributors(): Promise<void> {
    if (!selectedRepository.value || !props.owner) {
        return;
    }

    loading.value = true;
    hasLoaded.value = false;
    errorMessage.value = "";
    contributors.value = [];

    try {
        contributors.value =
            await getRepositoryContributors(
                props.owner,
                selectedRepository.value,
            );

        hasLoaded.value = true;
    } catch (error: unknown) {
        errorMessage.value =
            error instanceof Error
                ? error.message
                : "Could not load repository contributors.";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <section class="dashboard-card top-contributors-card">
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

            <button
                type="button"
                :disabled="!selectedRepository || loading"
                @click="loadContributors"
            >
                {{ loading ? "Loading..." : "Load contributors" }}
            </button>
        </div>

        <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
        </p>

        <p v-else-if="loading" class="loading-message">
            Loading contributors from GitHub...
        </p>

        <Chart
            v-else-if="hasLoaded && topContributors.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p
            v-else-if="hasLoaded"
            class="empty-chart-message"
        >
            No contributors were found for this repository.
        </p>

        <p v-else class="empty-chart-message">
            Select a repository to display its top contributors.
        </p>
    </section>
</template>