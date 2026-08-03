<script setup lang="ts">
import type { GithubListUser } from "../types/github";

defineProps<{
    title: string;
    users: GithubListUser[];
    loading: boolean;
}>();

const emit = defineEmits<{
    close: [];
    selectUser: [username: string];
}>();
</script>

<template>
    <section class="user-list-section">
        <div class="user-list-header">
            <h2>{{ title }}</h2>

            <button
                type="button"
                class="close-list-button"
                @click="emit('close')"
            >
                Close
            </button>
        </div>

        <p v-if="loading" class="loading-message">
            Loading users...
        </p>

        <p v-else-if="users.length === 0" class="empty-message">
            No users were found.
        </p>

        <div v-else class="github-user-grid">
            <article
                v-for="githubUser in users"
                :key="githubUser.id"
                class="github-user-card"
            >
                <img
                    :src="githubUser.avatar_url"
                    :alt="`Profile picture of ${githubUser.login}`"
                />

                <div>
                    <button
                        type="button"
                        class="username-button"
                        @click="emit('selectUser', githubUser.login)"
                    >
                        @{{ githubUser.login }}
                    </button>

                    <a
                        :href="githubUser.html_url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open GitHub
                    </a>
                </div>
            </article>
        </div>
    </section>
</template>