import type { RrSettingsRepoPort } from "../../application/ports/rrSettingsRepo";
import * as rrSettings from "../../config/rrSettingsRepo";

export class SqliteRrSettingsRepo implements RrSettingsRepoPort {
  setDmEnabled(guildId: string, enabled: boolean) {
    rrSettings.setDmEnabled(guildId, enabled);
  }

  getDmEnabled(guildId: string) {
    return rrSettings.getDmEnabled(guildId);
  }
}
