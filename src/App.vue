<script setup lang="ts">
import { computed, ref } from 'vue';

import type { 
  GithubUser, 
  GithubRepository,
  GithubListUser, 
} from './types/github';

import { 
  getGithubUser, 
  getGithubRepositories,
  getGithubFollowers,
  getGithubFollowing, 
} from './api/githubApi';

import RepositoryCard from './components/RepositoryCard.vue';
import UserProfile from './components/UserProfile.vue';
import GithubSearch from './components/GithubSearch.vue';
import GithubUserList from './components/GithubUserList.vue';
import ProgLanguageChart from './components/ProgLanguageChart.vue';

type UserListType = "followers" | "following";

const displayedUsers = ref<GithubListUser[]>([]);
const displayedListType = ref<UserListType | null>(null);
const userListLoading = ref(false);
const userListError = ref("");

const displayedListTitle = computed(() => {
    if (displayedListType.value === "followers") {
        return `Followers of ${user.value?.login ?? ""}`;
    }

    if (displayedListType.value === "following") {
        return `${user.value?.login ?? ""} is following`;
    }

    return "";
});

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

    closeUserList();

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
                : "An unknown error occurred.";
    } finally {
        loading.value = false;
    }
}

async function showFollowers(): Promise<void> {
    if (!user.value) {
        return;
    }

    displayedListType.value = "followers";
    displayedUsers.value = [];
    userListError.value = "";
    userListLoading.value = true;

    try {
        displayedUsers.value = await getGithubFollowers(
            user.value.login,
        );
    } catch (error: unknown) {
        userListError.value =
            error instanceof Error
                ? error.message
                : "Could not load followers.";
    } finally {
        userListLoading.value = false;
    }
}

async function showFollowing(): Promise<void> {
    if (!user.value) {
        return;
    }

    displayedListType.value = "following";
    displayedUsers.value = [];
    userListError.value = "";
    userListLoading.value = true;

    try {
        displayedUsers.value = await getGithubFollowing(
            user.value.login,
        );
    } catch (error: unknown) {
        userListError.value =
            error instanceof Error
                ? error.message
                : "Could not load following users.";
    } finally {
        userListLoading.value = false;
    }
}

function closeUserList(): void {
    displayedListType.value = null;
    displayedUsers.value = [];
    userListError.value = "";
}

async function selectUser(username: string): Promise<void> {
    closeUserList();
    await searchGithubUser(username);

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
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
      <UserProfile 
        :user="user"
        @show-followers="showFollowers"
        @show-following="showFollowing" 
      />

      <section
        v-if="user && !loading"
        class="dashboard-section"
      >
        <h2>Developer Dashboard</h2>
        <div class="dashboard-grid">
          <ProgLanguageChart
            :repositories="repositories"
          />
        </div>
      </section>

      <p v-if="userListError" class="error-message">
          {{ userListError }}
      </p>

      <GithubUserList
          v-if="displayedListType"
          :title="displayedListTitle"
          :users="displayedUsers"
          :loading="userListLoading"
          @close="closeUserList"
          @select-user="selectUser"
      />

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
