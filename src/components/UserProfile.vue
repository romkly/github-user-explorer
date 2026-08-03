<script setup lang="ts">
import type { GithubUser } from '../types/github';

defineProps<{
    user: GithubUser;
}>();

const emit = defineEmits<{
    showFollowers: [];
    showFollowing: [];
}>();
</script>

<template>
    <section class="profile-card">
        <img 
            class="profile-avatar"
            :src="user.avatar_url" 
            :alt="`Profile picture of ${user.login}`"
        />

        <div class="profile-content">
            <div>
                <h2>{{ user.name || user.login }}</h2>
                <a 
                    :href="user.html_url"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    @{{ user.login }}
                </a>
            </div>

            <p v-if="user.bio" class="profile-bio">
                {{ user.bio }}
            </p>

            <p v-if="user.location">
                📍 {{ user.location }}
            </p>

            <div class="profile-statistics">
                <div>
                    <strong>{{ user.public_repos }}</strong>
                    <span>Repositories</span>
                </div>

                <button
                    type="button"
                    class="profile-stat-button"
                    @click="emit('showFollowers')"
                >
                    <strong>{{ user.followers }}</strong>
                    <span>Followers</span>
                </button>

                <button
                    type="button"
                    class="profile-stat-button"
                    @click="emit('showFollowing')"
                >
                    <strong>{{ user.following }}</strong>
                    <span>Following</span>
                </button>
            </div>
        </div>
    </section>
</template>