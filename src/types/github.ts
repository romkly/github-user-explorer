export interface GithubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    location: string | null;
    followers: number;
    following: number;
    public_repos: number;
}

export interface GithubRepository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
    created_at: string;
}

export interface GithubListUser {
    id: string;
    login: string;
    avatar_url: string;
    html_url: string;
}