export interface TimedRoleRepoPort {
  list(guildId: string): { role_id: string; delay_ms: number }[];
  add(guildId: string, roleId: string, delayMs: number): void;
  remove(guildId: string, roleId: string): number;
}
