export interface AutoroleRepoPort {
  list(guildId: string): { target: string; role_id: string }[];
  add(guildId: string, target: string, roleId: string): void;
  remove(guildId: string, target: string, roleId: string): number;
}
