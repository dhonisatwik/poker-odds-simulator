# Texas Hold'em Poker Odds Calculator

A beginner-friendly static web app for estimating Texas Hold'em hand strength and winning probability from user-selected hole cards and community cards.

## Features

- Select two hole cards and up to five community cards
- Prevent duplicate-card setups
- Evaluate the current best hand description
- Estimate win, tie, and loss percentages versus 1 to 5 random opponents
- Use exact enumeration for heads-up river spots and Monte Carlo simulation elsewhere
- Responsive layout with visual card previews and a reset button

## How the probability calculation works

The app removes all known cards from a standard 52-card deck and then simulates the unknown information:

- If the board is complete and there is 1 opponent, it checks every possible opponent hand exactly
- Otherwise, it repeatedly:
  - draws the missing board cards
  - draws random opponent hole cards without duplicates
  - evaluates the best five-card hand out of seven cards for each player
  - records whether the hero wins, ties, or loses

After many trials, the app converts those counts into percentages.

## Run locally

Because this is a plain frontend app, you can run it in either of these ways:

1. Open [index.html](/Users/dhonisatwik/Documents/Codex/2026-04-20-so-my-friend-was-talking-about/index.html) directly in a browser.
2. Or serve the folder with a simple local server if you prefer.

## Files

- [index.html](/Users/dhonisatwik/Documents/Codex/2026-04-20-so-my-friend-was-talking-about/index.html) - page structure
- [styles.css](/Users/dhonisatwik/Documents/Codex/2026-04-20-so-my-friend-was-talking-about/styles.css) - responsive UI styling
- [poker.js](/Users/dhonisatwik/Documents/Codex/2026-04-20-so-my-friend-was-talking-about/poker.js) - deck, hand evaluation, and odds engine
- [app.js](/Users/dhonisatwik/Documents/Codex/2026-04-20-so-my-friend-was-talking-about/app.js) - UI wiring and live updates
