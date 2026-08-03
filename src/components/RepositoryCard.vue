<script setup lang="ts">
import type { GithubRepository } from '../types/github';

defineProps<{
    repository: GithubRepository;
}>();

function formatDate(date: string): string {
    return new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}
</script>

<template>
    <article class="repository-card">
        <div class="repository-header">
            <h3>
                <a 
                    :href="repository.html_url"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {{ repository.name }}
                </a>
            </h3>

            <span v-if="repository.language" class="language">
                {{ repository.language }}
            </span>
        </div>

        <p class="repository-description">
            {{ 
                repository.description ||
                "No description"    
            }}
        </p>

        <div class="repository-details">
            <span>⭐ {{ repository.stargazers_count }}</span>
            <span>⑂ {{ repository.forks_count }}</span>
            <span>Updated {{ formatDate(repository.updated_at) }}</span>
        </div>
    </article>
</template>