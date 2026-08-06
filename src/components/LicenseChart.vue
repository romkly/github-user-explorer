<script setup lang="ts">
import { computed } from "vue";
import type { Options } from "highcharts";
import { Chart } from "highcharts-vue";
import Highcharts from "highcharts";

import type { GithubRepository } from "../types/github";

type LicenseDistributionData = {
    name: string;
    count: number;
    repositoryNames: string[];
};

const props = defineProps<{
    repositories: GithubRepository[];
}>();

function getLicenseName(repository: GithubRepository): string {
    const license = repository.license;

    if (!license) {
        return "No license";
    }

    if (
        license.spdx_id &&
        license.spdx_id !== "NOASSERTION"
    ) {
        return license.spdx_id;
    }

    if (license.name) {
        return license.name;
    }

    return "Unknown license";
}

const licenseDistribution = computed<
    LicenseDistributionData[]
>(() => {
    const licenseCounts = new Map<
        string,
        {
            count: number;
            repositoryNames: string[];
        }
    >();

    for (const repository of props.repositories) {
        const licenseName = getLicenseName(repository);

        const currentLicense = licenseCounts.get(
            licenseName,
        ) ?? {
            count: 0,
            repositoryNames: [],
        };

        currentLicense.count += 1;
        currentLicense.repositoryNames.push(
            repository.name,
        );

        licenseCounts.set(
            licenseName,
            currentLicense,
        );
    }

    return [...licenseCounts.entries()]
        .map(([name, data]) => ({
            name,
            count: data.count,
            repositoryNames: data.repositoryNames,
        }))
        .sort(
            (firstLicense, secondLicense) =>
                secondLicense.count -
                firstLicense.count,
        );
});

const totalRepositories = computed(() => {
    return licenseDistribution.value.reduce(
        (total, license) => total + license.count,
        0,
    );
});

const licensedRepositories = computed(() => {
    return licenseDistribution.value
        .filter((license) => license.name !== "No license")
        .reduce(
            (total, license) => total + license.count,
            0,
        );
});

const licenseCoveragePercentage = computed(() => {
    if (totalRepositories.value === 0) {
        return 0;
    }

    return Math.round(
        (licensedRepositories.value /
            totalRepositories.value) *
            100,
    );
});

const chartOptions = computed<Options>(() => ({
    chart: {
        type: "pie",
        backgroundColor: "#121212",
    },

    title: {
        text: "License Distribution",

        style: {
            color: "#ffffff",
        },
    },

    subtitle: {
        text: `${licenseCoveragePercentage.value}% of repositories have a detected license`,

        style: {
            color: "#cccccc",
        },
    },

    accessibility: {
        description:
            "A pie chart showing the distribution of detected software licenses across the developer's public repositories.",
    },

    tooltip: {
        useHTML: true,

        formatter() {
            const custom = this.options.custom as
                | {
                      repositoryNames?: string[];
                  }
                | undefined;

            const licenseName =
                typeof this.name === "string"
                    ? this.name
                    : "Unknown license";

            const count =
                typeof this.y === "number"
                    ? this.y
                    : 0;

            const percentage =
                typeof this.percentage === "number"
                    ? this.percentage
                    : 0;

            const repositoryNames =
                custom?.repositoryNames ?? [];

            const displayedRepositories =
                repositoryNames.slice(0, 6);

            const repositoryList =
                displayedRepositories.length > 0
                    ? displayedRepositories
                          .map(
                              (repositoryName) =>
                                  `<br>• ${repositoryName}`,
                          )
                          .join("")
                    : "";

            const remainingRepositories =
                repositoryNames.length -
                displayedRepositories.length;

            const remainingText =
                remainingRepositories > 0
                    ? `<br>• and ${remainingRepositories} more`
                    : "";

            return `
                <div style="min-width:200px">
                    <b>${licenseName}</b>
                    <br>
                    ${count}
                    ${count === 1 ? "repository" : "repositories"}
                    <br>
                    ${percentage.toFixed(1)}%
                    ${
                        repositoryList
                            ? `<br><br><span style="color:#aaaaaa">
                                Projects:
                                ${repositoryList}
                                ${remainingText}
                            </span>`
                            : ""
                    }
                </div>
            `;
        },
    },

    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: "pointer",
            borderWidth: 2,
            borderColor: "#121212",

            dataLabels: {
                enabled: true,

                formatter() {
                    const name =
                        typeof this.name === "string"
                            ? this.name
                            : "Unknown";

                    const count =
                        typeof this.y === "number"
                            ? this.y
                            : 0;

                    const percentage =
                        typeof this.percentage === "number"
                            ? this.percentage
                            : 0;

                    if (percentage < 4) {
                        return "";
                    }

                    return `${name}<br>${count} (${percentage.toFixed(
                        0,
                    )}%)`;
                },

                style: {
                    color: "#ffffff",
                    textOutline: "none",
                    fontSize: "11px",
                },
            },

            showInLegend: true,
        },
    },

    series: [
        {
            type: "pie",
            name: "Repositories",

            data: licenseDistribution.value.map(
                (license) => ({
                    name: license.name,
                    y: license.count,

                    custom: {
                        repositoryNames:
                            license.repositoryNames,
                    },
                }),
            ),
        },
    ],

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
    <section class="dashboard-card license-distribution-card">
        <Chart
            v-if="licenseDistribution.length > 0"
            :highcharts="Highcharts"
            :options="chartOptions"
        />

        <p v-else class="empty-chart-message">
            No repository license data is available.
        </p>
    </section>
</template>