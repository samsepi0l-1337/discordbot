import type { AutoroleRepoPort } from "../../application/ports/autoroleRepo";
import * as autoroleRepo from "../../config/autoroleRepo";

export class SqliteAutoroleRepo implements AutoroleRepoPort {
  list(guildId: string) {
    return autoroleRepo.listAutoroles(guildId);
  }

  add(guildId: string, target: string, roleId: string) {
    autoroleRepo.addAutorole(guildId, target, roleId);
  }

  remove(guildId: string, target: string, roleId: string) {
    return autoroleRepo.removeAutorole(guildId, target, roleId);
  }
}
