import type {
    GithubUser,
    GithubRepository,
    GithubListUser,
    GithubCommit,
    GithubContributor,
} from '../types/github';

const GITHUB_API_URL = 'https://api.github.com';

async function handleResponse<T>(response: Response): Promise<T> {
    if(response.status === 404) {
        throw new Error('Github user does not exist')
    }

    if(response.status === 403) {
        throw new Error('Github API-limit has been reached. Try again later.')
    }

    if(!response.ok) {
        throw new Error(`Github API returned the eror ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export async function getGithubUser(username: string): Promise<GithubUser> {
    const encodedUsername = encodeURIComponent(username);

    const response = await fetch(`${GITHUB_API_URL}/users/${encodedUsername}`);

    return handleResponse<GithubUser>(response);
}

export async function getGithubRepositories(username: string): Promise<GithubRepository[]> {
    const encodedUsername = encodeURIComponent(username);

    const response = await fetch(`${GITHUB_API_URL}/users/${encodedUsername}/repos?per_page=100&sort=updated`);

    return handleResponse<GithubRepository[]>(response);
}

export async function getGithubFollowers(username: string): Promise<GithubListUser[]> {
    const encodedUsername = encodeURIComponent(username);

    const response = await fetch(`${GITHUB_API_URL}/users/${encodedUsername}/followers?per_page=50`);

    return handleResponse<GithubListUser[]>(response);
}

export async function getGithubFollowing(username: string): Promise<GithubListUser[]> {
    const encodedUsername = encodeURIComponent(username);

    const response = await fetch(`${GITHUB_API_URL}/users/${encodedUsername}/following?per_page=50`);

    return handleResponse<GithubListUser[]>(response);
}

export async function getRepositoryCommits(
    owner: string,
    repositoryName: string,
): Promise<GithubCommit[]> {
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepository = encodeURIComponent(repositoryName);

    const response = await fetch(
        `${GITHUB_API_URL}/repos/${encodedOwner}/${encodedRepository}/commits?per_page=100`,
    );

    return handleResponse<GithubCommit[]>(response);
}

export async function getRepositoryContributors(
    owner: string,
    repositoryName: string,
): Promise<GithubContributor[]> {
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepository = encodeURIComponent(repositoryName);

    const response = await fetch(
        `${GITHUB_API_URL}/repos/${encodedOwner}/${encodedRepository}/contributors?per_page=100`,
        {
            headers: {
                Accept: "application/vnd.github+json",
            },
        },
    );

    if (response.status === 204) {
        return [];
    }

    return handleResponse<GithubContributor[]>(response);
}