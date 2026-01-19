# Discord Onboarding & Ticket Bot

Automates onboarding roles, reaction roles, and provides a robust ticket system using Discord's latest features.

## Features

- **Ticket System**: Channel/Thread-based tickets with private threads, support roles, and transcripts.
- **Reaction Roles**: Support for various types (Normal, Once, Remove, Toggle) with emoji parsing.
- **Onboarding**: Automated roles (Autorole) for users/bots and timed roles upon joining.
- **Command Permissions**: Granular control over who can manage the bot via role or user allow lists.
- **Auto-Registration**: Slash commands and context menus are automatically registered on startup.

## Requirements

- Node.js 18+
- Discord bot with privileged intents enabled:
  - Server Members Intent
  - Message Content Intent

## Setup

1. Install dependencies:
   - `npm install`
2. Build the project:
   - `npm run build`
3. Create `.env` and fill in:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - Optional: `GUILD_ID` (for instant command registration during development)
4. Start the bot:
   - `npm start` (Commands will register automatically)

## Main Slash Commands

- `/config`: Manage bot administrative settings and intro channel roles.
- `/rr`: Configure reaction roles, autoroles, and timed roles.
- `/ticket`: Set up and manage the ticket system.

## Behavior

- On startup, the bot loads all commands and syncs them with Discord.
- If `GUILD_ID` is provided, commands sync instantly to that server.
- Without `GUILD_ID`, commands sync globally (may take a few minutes).

## Data Storage

- SQLite database for persistent configuration and ticket sessions.

## Troubleshooting

- If roles are not assigned, check if the bot role is **above** the roles it assigns in the Server Settings.
- Ensure all required privileged intents are enabled in the Discord Developer Portal.
