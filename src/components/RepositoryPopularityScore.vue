<script setup lang="ts">
import { computed } from "vue";
import Highcharts from "highcharts";
import { Chart } from "highcharts-vue";
import type { Options } from "highcharts";

import type { GithubRepository } from "../types/github";

type PopularityBreakdown = {
    starsScore: number;
    forksScore: number;
    watchersScore: number;
    activityScore: number;
};

type RepositoryPopularityData = {
    name: string;
    score: number;
    stars: number;
    forks: number;
    watchers: number;
    daysSinceLastPush: number | null;
    breakdown: PopularityBreakdown;
    url: string;
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

const STAR_WEIGHT = 4;
const FORK_WEIGHT = 6;
const WATCHER_WEIGHT = 3;

function calculateDaysSince(dateString: string | null): number | null {
    if (!dateString) {
        return null;
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const difference = Date.now() - date.getTime();

    return Math.max(
        0,
        Math.floor(difference / millisecondsPerDay),
    );
}

function calculateActivityScore(
    daysSinceLastPush: number | null,
): number {
    if (daysSinceLastPush === null) {
        return 0;
    }

    if (daysSinceLastPush <= 30) {
        return 20;
    }

    if (daysSinceLastPush <= 90) {
        return 15;
    }

    if (daysSinceLastPush <= 180) {
        return 10;
    }

    if (daysSinceLastPush <= 365) {
        return 5;
    }

    return 0;
}

function formatActivity(
    daysSinceLastPush: number | null,
): string {
    if (daysSinceLastPush === null) {
        return "No valid push date";
    }

    if (daysSinceLastPush === 0) {
        return "Pushed today";
    }

    if (daysSinceLastPush === 1) {
        return "Pushed 1 day ago";
    }

    return `Pushed ${daysSinceLastPush} days ago`;
}

const popularityData = computed<RepositoryPopularityData[]>(() => {
    return props.repositories
        .map((repository) => {
            const stars = repository.stargazers_count ?? 0;
            const forks = repository.forks_count ?? 0;
            const watchers = repository.subscribers_count ?? 0;

            const daysSinceLastPush = calculateDaysSince(
                repository.pushed_at,
            );

            const breakdown: PopularityBreakdown = {
                starsScore: stars * STAR_WEIGHT,
                forksScore: forks * FORK_WEIGHT,
                watchersScore: watchers * WATCHER_WEIGHT,
                activityScore:
                    calculateActivityScore(daysSinceLastPush),
            };

            const score =
                breakdown.starsScore +
                breakdown.forksScore +
                breakdown.watchersScore +
                breakdown.activityScore;

            return {
                name: repository.name,
                score,
                stars,
                forks,
                watchers,
                daysSinceLastPush,
                breakdown,
                url: repository.html_url,
            };
        })
        .filter((repository) => repository.score > 0)
        .sort(
            (firstRepository, secondRepository) =>
                secondRepository.score - firstRepository.score,
        )
        .slice(0, 10);
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "bar",
        backgroundColor: "#121212",
        height: Math.max(
            400,
            popularityData.value.length * 58 + 170,
        ),
    },

    title: {
        text: "Repository Popularity Score",
        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text:
            "Custom score based on stars, forks, watchers and recent activity",
        style: {
            color: "#cccccc",
        },
    },
    
    xAxis: {
        categories: popularityData.value.map(
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
            text: "Popularity score",
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
        useHTML: true,

        formatter() {
            const custom = this.options.custom as
                | {
                      repositoryName?: string;
                      stars?: number;
                      forks?: number;
                      watchers?: number;
                      daysSinceLastPush?: number | null;
                      breakdown?: PopularityBreakdown;
                  }
                | undefined;

            const repositoryName =
                custom?.repositoryName ?? "Unknown repository";

            const score =
                typeof this.y === "number" ? this.y : 0;

            const breakdown = custom?.breakdown;

            return `
                <div style="min-width:220px">
                    <b>${repositoryName}</b>
                    <br><br>

                    Total score: <b>${score}</b>
                    <br>

                    Stars: ${custom?.stars ?? 0}
                    × ${STAR_WEIGHT}
                    = ${breakdown?.starsScore ?? 0}
                    <br>

                    Forks: ${custom?.forks ?? 0}
                    × ${FORK_WEIGHT}
                    = ${breakdown?.forksScore ?? 0}
                    <br>

                    Watchers: ${custom?.watchers ?? 0}
                    × ${WATCHER_WEIGHT}
                    = ${breakdown?.watchersScore ?? 0}
                    <br>

                    Activity:
                    ${breakdown?.activityScore ?? 0}
                    <br>

                    <span style="color:#aaaaaa">
                        ${formatActivity(
                            custom?.daysSinceLastPush ?? null,
                        )}
                    </span>
                </div>
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
            name: "Popularity score",

            data: popularityData.value.map((repository) => ({
                y: repository.score,

                custom: {
                    repositoryName: repository.name,
                    stars: repository.stars,
                    forks: repository.forks,
                    watchers: repository.watchers,
                    daysSinceLastPush:
                        repository.daysSinceLastPush,
                    breakdown: repository.breakdown,
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
            v-if="popularityData.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository popularity data is available.
        </p>

        <p class="chart-method-note">
            Custom formula: stars × 4 + forks × 6 +
            watchers × 3 + activity score.
        </p>
    </section>
</template>