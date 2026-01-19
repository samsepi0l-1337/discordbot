"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticketService_1 = require("../application/services/ticketService");
const ticketService_2 = require("../application/services/ticketService");
const ticketRepo_1 = require("../infrastructure/sqlite/ticketRepo");
const guildConfigRepo_1 = require("../infrastructure/sqlite/guildConfigRepo");
const ticketRepo = new ticketRepo_1.SqliteTicketRepo();
const configRepo = new guildConfigRepo_1.SqliteGuildConfigRepo();
const service = new ticketService_1.TicketService(ticketRepo, configRepo);
const postTicketPanel = service.postTicketPanel.bind(service);
const createTicketChannelTicket = service.createTicketChannelTicket.bind(service);
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
    TICKET_CREATE_BUTTON_ID: ticketService_2.TICKET_CREATE_BUTTON_ID,
    TICKET_CLOSE_BUTTON_ID: ticketService_2.TICKET_CLOSE_BUTTON_ID,
    TICKET_CLAIM_BUTTON_ID: ticketService_2.TICKET_CLAIM_BUTTON_ID,
    TICKET_UNCLAIM_BUTTON_ID: ticketService_2.TICKET_UNCLAIM_BUTTON_ID,
    postTicketPanel,
    createTicketSession,
    getLatestOpenTicketForUser,
    getTicketById,
    getOpenTicketByChannel,
    touchTicket,
    closeTicketSession,
    setTicketClaim,
    createTicketChannelTicket,
    handleTicketCloseButton,
    handleTicketClaimButton,
    purgeOldTickets,
};
