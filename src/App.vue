<script setup lang="ts">
import { computed, ref } from 'vue';

import GithubSearch from './components/GithubSearch.vue'

import type { GithubUser, GithubRepository } from './types/github';
import { getGithubUser, getGithubRepositories } from './api/githubApi';
import RepositoryCard from './components/RepositoryCard.vue';

type SortOption = 'updated' | 'stars' | 'name';

const user = ref<GithubUser | null>(null);
const repositories = ref<GithubRepository[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const sortOption = ref<SortOption>('updated');

const sortedRepositories = computed(() => {
    const repositoryCopy = [...repositories.value];

    switch (sortOption.value){
      case 'stars':
        return repositoryCopy.sort((a, b) => b.stargazers_count - a.stargazers_count);
      case 'name':
        return repositoryCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'updated':
      default:
        return repositoryCopy;
    }
});

async function searchGithubUser(username: string): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  user.value = null;
  repositories.value = [];

  try {
    const [userData, repositoryData] = await Promise.all([
      getGithubUser(username),
      getGithubRepositories(username),
    ]);

    user.value = userData;
    repositories.value = repositoryData;
  } catch (error: unknown) {
    errorMessage.value = 
      error instanceof Error
        ? error.message
        : 'An unknown error has occured';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page-container">
    <header class="page-header">
      <h1>Github User Explorer</h1>
      <p>Search after the username and explore profiles</p>
    </header>

    <GithubSearch 
      :loading="loading"
      @search="searchGithubUser"
    />

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <div v-if="loading" class="loading-message">
      Fetching data from Github...
    </div>

    <template v-if="user && !loading">
      <section class="repositories-section">
        <div class="section-header">
          <div>
            <h2>Repositories</h2>
            <p>
              {{ repositories.length }} public projects has been found.
            </p>
          </div>

          <label class="sort-control">
            Sort

            <select v-model="sortOption">
              <option value="updated">
                Last updated
              </option>
              <option value="stars">
                Most stars
              </option>
              <option value="name">
                Name
              </option>
            </select>
          </label>
        </div>

        <div
          v-if="sortedRepositories.length"
          class="repository-grid"
        >
          <RepositoryCard
            v-for="repository in sortedRepositories"
            :key="repository.id"
            :repository="repository"  
          />
        </div>

        <p v-else class="empty-message">
          This user has no public repositories,
        </p>
      </section>
    </template>
  </main>
</template>
