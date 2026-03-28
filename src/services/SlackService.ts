export interface SlackMessage {
  id: string;
  channel: string;
  author: string;
  text: string;
  timestamp: Date;
  threadReplies: SlackMessage[];
}

export interface SlackActivityContext {
  channels: string[];
  windowStart: Date;
  windowEnd: Date;
  messages: SlackMessage[];
  threads: SlackMessage[];
}

export class SlackService {
  constructor(private botToken: string) {}

  async fetchActivity(channelIds: string[], days: number = 1): Promise<SlackActivityContext> {
    throw new Error('Not implemented');
  }
}
