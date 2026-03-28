import { ActivityContext, AnalysisResult } from '../types';

export class IntelligenceService {
  constructor(private apiKey: string, private model: string = 'gpt-4o') {}

  async analyze(context: ActivityContext): Promise<AnalysisResult> {
    throw new Error('Not implemented');
  }
}
