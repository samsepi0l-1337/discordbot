import type { GuildConfigRepoPort } from "../../application/ports/guildConfigPort";
import * as configRepo from "../../config/guildConfigRepo";

export class SqliteGuildConfigRepo implements GuildConfigRepoPort {
  getConfig(guildId: string) {
    return configRepo.getConfig(guildId);
  }

  setJoinDelayMs(guildId: string, joinDelayMs: number) {
    configRepo.setJoinDelayMs(guildId, joinDelayMs);
  }

  setBaseRole(guildId: string, roleId: string) {
    configRepo.setBaseRole(guildId, roleId);
  }

  setIntro(guildId: string, channelId: string, roleId: string) {
    configRepo.setIntro(guildId, channelId, roleId);
  }

  setTicketChannel(guildId: string, channelId: string) {
    configRepo.setTicketChannel(guildId, channelId);
  }

  setTicketPanelMessage(guildId: string, messageId: string) {
    configRepo.setTicketPanelMessage(guildId, messageId);
  }

  setTicketCategory(guildId: string, categoryId: string) {
    configRepo.setTicketCategory(guildId, categoryId);
  }

  setTicketTranscriptChannel(guildId: string, channelId: string) {
    configRepo.setTicketTranscriptChannel(guildId, channelId);
  }

  addTicketSupportRole(guildId: string, roleId: string) {
    configRepo.addTicketSupportRole(guildId, roleId);
  }

  removeTicketSupportRole(guildId: string, roleId: string) {
    configRepo.removeTicketSupportRole(guildId, roleId);
  }

  addTicketSupportUser(guildId: string, userId: string) {
    configRepo.addTicketRecipient(guildId, userId);
  }

  removeTicketSupportUser(guildId: string, userId: string) {
    configRepo.removeTicketRecipient(guildId, userId);
  }

  addCommandRole(guildId: string, roleId: string) {
    configRepo.addCommandRole(guildId, roleId);
  }

  removeCommandRole(guildId: string, roleId: string) {
    configRepo.removeCommandRole(guildId, roleId);
  }

  addCommandUser(guildId: string, userId: string) {
    configRepo.addCommandUser(guildId, userId);
  }

  removeCommandUser(guildId: string, userId: string) {
    configRepo.removeCommandUser(guildId, userId);
  }

  clearField(guildId: string, fieldKey: string) {
    return configRepo.clearField(guildId, fieldKey);
  }

  resetConfig(guildId: string) {
    configRepo.resetConfig(guildId);
  }
}
