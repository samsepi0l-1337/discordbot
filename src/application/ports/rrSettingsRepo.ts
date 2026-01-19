export interface RrSettingsRepoPort {
  setDmEnabled(guildId: string, enabled: boolean): void;
  getDmEnabled(guildId: string): boolean;
}
