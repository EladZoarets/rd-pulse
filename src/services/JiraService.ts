import { JiraSprintContext, JiraFetchOptions } from '../types';

export class JiraService {
  constructor(
    private host: string,
    private email: string,
    private apiToken: string
  ) {}

  async fetchSprintContext(boardId: string, options?: JiraFetchOptions): Promise<JiraSprintContext> {
    throw new Error('Not implemented');
  }
}
