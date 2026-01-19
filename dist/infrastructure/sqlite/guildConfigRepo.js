"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteGuildConfigRepo = void 0;
const configRepo = __importStar(require("../../config/guildConfigRepo"));
class SqliteGuildConfigRepo {
    getConfig(guildId) {
        return configRepo.getConfig(guildId);
    }
    setIntro(guildId, channelId, roleId) {
        configRepo.setIntro(guildId, channelId, roleId);
    }
    setTicketChannel(guildId, channelId) {
        configRepo.setTicketChannel(guildId, channelId);
    }
    setTicketPanelMessage(guildId, messageId) {
        configRepo.setTicketPanelMessage(guildId, messageId);
    }
    setTicketCategory(guildId, categoryId) {
        configRepo.setTicketCategory(guildId, categoryId);
    }
    setTicketTranscriptChannel(guildId, channelId) {
        configRepo.setTicketTranscriptChannel(guildId, channelId);
    }
    addTicketSupportRole(guildId, roleId) {
        configRepo.addTicketSupportRole(guildId, roleId);
    }
    removeTicketSupportRole(guildId, roleId) {
        configRepo.removeTicketSupportRole(guildId, roleId);
    }
    addTicketSupportUser(guildId, userId) {
        configRepo.addTicketRecipient(guildId, userId);
    }
    removeTicketSupportUser(guildId, userId) {
        configRepo.removeTicketRecipient(guildId, userId);
    }
    addCommandRole(guildId, roleId) {
        configRepo.addCommandRole(guildId, roleId);
    }
    removeCommandRole(guildId, roleId) {
        configRepo.removeCommandRole(guildId, roleId);
    }
    addCommandUser(guildId, userId) {
        configRepo.addCommandUser(guildId, userId);
    }
    removeCommandUser(guildId, userId) {
        configRepo.removeCommandUser(guildId, userId);
    }
    clearField(guildId, fieldKey) {
        return configRepo.clearField(guildId, fieldKey);
    }
    resetConfig(guildId) {
        configRepo.resetConfig(guildId);
    }
}
exports.SqliteGuildConfigRepo = SqliteGuildConfigRepo;
