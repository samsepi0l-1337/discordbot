# Discord Onboarding Role Bot

Automates onboarding roles and channel-gated access using Discord events.

## Features
- Delay-based base role assignment on member join
- Grant role when a user posts in a specific channel
- Add a check reaction and grant role when a user posts in the intro channel
- Per-guild configuration via slash commands

## Requirements
- Node.js 18+
- Discord bot with privileged intents enabled:
  - Server Members Intent
  - Message Content Intent

## Setup
1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example` and fill in:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - Optional: `GUILD_ID` (for faster command registration in one guild)
3. Register slash commands:
   - `npm run register`
4. Start the bot:
   - `npm start`

## Slash Commands
Use `/config` in your server (requires Manage Server permission):
- `/config set-base-role role:<Role>`
- `/config set-join-delay seconds:<Number>`
- `/config set-intro channel:<Channel> role:<Role> emoji(optional):<String>`
- `/config set-grant-on-post channel:<Channel> role:<Role>`
- `/config show`
- `/config clear field:<field>`
- `/config reset`

## Behavior
- On member join: waits `join_delay_ms` then assigns base role
- On message in grant channel: assigns configured role
- On message in intro channel: reacts with configured emoji and assigns intro role

## Notes
- Join-delay timers are in-memory. Pending role assignments are lost on restart.

## Permissions Checklist
- Bot permissions:
  - Manage Roles
  - Read Messages/View Channels
  - Add Reactions
  - Send Messages
- Role hierarchy:
  - The bot role must be **above** the roles it assigns
- Channel visibility:
  - Use Discord channel permissions so base role unlocks intro/grant channels

## Data Storage
- SQLite database at `data/bot.db`
- Settings are stored per guild

## Troubleshooting
- If roles are not assigned, check:
  - Bot role hierarchy vs target roles
  - Bot has Manage Roles
  - Correct IDs configured via `/config`
  - Intents enabled in Discord Developer Portal
