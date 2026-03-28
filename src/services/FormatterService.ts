import { AnalysisResult } from '../types';

export class FormatterService {
  format(result: AnalysisResult, owner: string, repo: string): string {
    throw new Error('Not implemented');
  }
}
