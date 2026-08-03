<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
    loading: boolean;
}>();

const emit = defineEmits<{
    search: [username: string];
}>();

const username = ref('');

function submitSearch() {
    const cleanUsername = username.value.trim();

    if(!cleanUsername) {
        return;
    }

    emit('search', cleanUsername);
}
</script>

<template>
    <form class="search-form" @submit.prevent="submitSearch">
        <input
            type="text"
            v-model="username"
            placeholder="Enter a GitHub username"
            required
            :disabled="loading"
        />
        <button type="submit" :disabled="loading || !username.trim()">
            {{ loading ? 'Searching...' : 'Search' }}
        </button>
    </form>
</template>