import { ReactionRoleService } from "../../application/services/reactionRoleService";
import { VoiceRoleService } from "../../application/services/voiceRoleService";
import { OnboardingService } from "../../application/services/onboardingService";
import { IntroRoleService } from "../../application/services/introRoleService";
import { SqliteRrRepo } from "../../infrastructure/sqlite/rrRepo";
import { SqliteRrSettingsRepo } from "../../infrastructure/sqlite/rrSettingsRepo";
import { SqliteVoiceRoleRepo } from "../../infrastructure/sqlite/voiceRoleRepo";
import { SqliteAutoroleRepo } from "../../infrastructure/sqlite/autoroleRepo";
import { SqliteTimedRoleRepo } from "../../infrastructure/sqlite/timedRoleRepo";
import { SqliteGuildConfigRepo } from "../../infrastructure/sqlite/guildConfigRepo";
import { DiscordRoleManager } from "../../infrastructure/discord/discordRoleManager";

const rrRepo = new SqliteRrRepo();
const rrSettingsRepo = new SqliteRrSettingsRepo();
const voiceRoleRepo = new SqliteVoiceRoleRepo();
const autoroleRepo = new SqliteAutoroleRepo();
const timedRoleRepo = new SqliteTimedRoleRepo();
const guildConfigRepo = new SqliteGuildConfigRepo();
const roleManager = new DiscordRoleManager();

export const reactionRoleService = new ReactionRoleService(
  rrRepo,
  rrSettingsRepo,
  roleManager
);

export const voiceRoleService = new VoiceRoleService(voiceRoleRepo, roleManager);

export const onboardingService = new OnboardingService(
  guildConfigRepo,
  autoroleRepo,
  timedRoleRepo,
  roleManager,
  (fn, delayMs) => setTimeout(fn, delayMs)
);

export const introRoleService = new IntroRoleService(guildConfigRepo, roleManager);
