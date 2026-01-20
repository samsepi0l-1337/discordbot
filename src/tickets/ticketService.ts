import { TicketService } from "../application/services/ticketService";
import {
  TICKET_CREATE_BUTTON_ID,
  TICKET_CREATE_MODAL_ID,
  TICKET_CLOSE_BUTTON_ID,
  TICKET_CLAIM_BUTTON_ID,
  TICKET_UNCLAIM_BUTTON_ID,
} from "../application/services/ticketService";
import { SqliteTicketRepo } from "../infrastructure/sqlite/ticketRepo";
import { SqliteGuildConfigRepo } from "../infrastructure/sqlite/guildConfigRepo";

const ticketRepo = new SqliteTicketRepo();
const configRepo = new SqliteGuildConfigRepo();
const service = new TicketService(ticketRepo, configRepo);

const postTicketPanel = service.postTicketPanel.bind(service);
const createTicketChannelTicket = service.createTicketChannelTicket.bind(service);
const handleTicketCreateModalSubmit = service.handleTicketCreateModalSubmit.bind(service);
const handleTicketCloseButton = service.handleTicketCloseButton.bind(service);
const handleTicketClaimButton = service.handleTicketClaimButton.bind(service);
const purgeOldTickets = service.purgeOldTickets.bind(service);

const createTicketSession = ticketRepo.createSession.bind(ticketRepo);
const getLatestOpenTicketForUser = ticketRepo.getLatestOpenByUser.bind(ticketRepo);
const getTicketById = ticketRepo.getById.bind(ticketRepo);
const getOpenTicketByChannel = ticketRepo.getOpenByChannel.bind(ticketRepo);
const touchTicket = ticketRepo.touch.bind(ticketRepo);
const closeTicketSession = ticketRepo.close.bind(ticketRepo);
const setTicketClaim = ticketRepo.setClaim.bind(ticketRepo);

module.exports = {
  TICKET_CREATE_BUTTON_ID,
  TICKET_CREATE_MODAL_ID,
  TICKET_CLOSE_BUTTON_ID,
  TICKET_CLAIM_BUTTON_ID,
  TICKET_UNCLAIM_BUTTON_ID,
  postTicketPanel,
  createTicketSession,
  getLatestOpenTicketForUser,
  getTicketById,
  getOpenTicketByChannel,
  touchTicket,
  closeTicketSession,
  setTicketClaim,
  createTicketChannelTicket,
  handleTicketCreateModalSubmit,
  handleTicketCloseButton,
  handleTicketClaimButton,
  purgeOldTickets,
};
