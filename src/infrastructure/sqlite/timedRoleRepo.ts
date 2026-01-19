import type { TimedRoleRepoPort } from "../../application/ports/timedRoleRepo";
import * as timedRepo from "../../config/timedRoleRepo";

export class SqliteTimedRoleRepo implements TimedRoleRepoPort {
  list(guildId: string) {
    return timedRepo.listTimedRoles(guildId);
  }

  add(guildId: string, roleId: string, delayMs: number) {
    timedRepo.addTimedRole(guildId, roleId, delayMs);
  }

  remove(guildId: string, roleId: string) {
    return timedRepo.removeTimedRole(guildId, roleId);
  }
}
