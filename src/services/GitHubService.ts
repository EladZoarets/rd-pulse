import { ActivityContext } from '../types';

export class GitHubService {
  constructor(private token: string) {}

  async fetchActivity(owner: string, repo: string, days: number = 1): Promise<ActivityContext> {
    throw new Error('Not implemented');
  }
}
