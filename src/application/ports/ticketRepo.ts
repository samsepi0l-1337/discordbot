export type TicketSession = {
  id: number;
  guild_id: string;
  opener_id: string;
  channel_id: string | null;
  claimed_by_id: string | null;
  closed_by_id: string | null;
  closed_reason: string | null;
  closed_at: number | null;
  status: "open" | "closed";
  created_at: number;
  updated_at: number;
};

export interface TicketRepo {
  createSession(guildId: string, openerId: string, channelId: string): number;
  getLatestOpenByUser(
    guildId: string,
    openerId: string,
  ): TicketSession | undefined;
  getById(ticketId: number): TicketSession | undefined;
  getOpenByChannel(
    guildId: string,
    channelId: string,
  ): TicketSession | undefined;
  close(
    ticketId: number,
    closedById?: string | null,
    reason?: string | null,
  ): void;
  touch(ticketId: number): void;
  setClaim(ticketId: number, claimedById?: string | null): void;
  purgeClosedBefore(timestampMs: number): number;
}
