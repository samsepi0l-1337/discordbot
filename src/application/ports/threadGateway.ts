export type ThreadCreateInput = {
  name: string;
  parentChannelId: string;
  autoArchiveDuration: number;
  reason?: string;
};

export interface ThreadGatewayPort {
  createPrivateThread(input: ThreadCreateInput): Promise<{ id: string }>;
  addMember(threadId: string, userId: string): Promise<void>;
  removeMember(threadId: string, userId: string): Promise<void>;
  lockAndArchive(threadId: string): Promise<void>;
  unarchive(threadId: string): Promise<void>;
  sendMessage(
    threadId: string,
    content: string,
    components?: unknown[],
  ): Promise<void>;
  fetchThreadMessages(
    threadId: string,
    limit: number,
  ): Promise<
    {
      id: string;
      createdTimestamp: number;
      authorTag?: string;
      content: string;
      attachmentUrls: string[];
    }[]
  >;
  sendTranscript(
    channelId: string,
    content: string,
    filename: string,
    description?: string,
  ): Promise<void>;
}
