# Tank's Great Adventure

A 1990s-style adventure game built with Phaser 3, based on a story by Alexander Brown.

## The Story

Tank is a super-strong but hilariously "not smart" female martial artist who travels from Brazil to Canada with two companions: a talking pig with a Western/cowboy accent, and a deer named Mr. Snuggles.

Tank's "dumbness" is actually a superpower - she's immune to poison because she doesn't know it's poisonous, she gets power-ups from destroying cars because she thinks they're monsters, etc.

**Journey**: Brazil -> Caribbean -> Puerto Rico -> Florida -> Texas -> Wyoming -> Idaho -> Montana -> Canada

## Art Style

Hand-painted 1990s Sierra/LucasArts adventure game aesthetic - like King's Quest V or Monkey Island 2. Rich saturated colors, detailed painterly brushwork, atmospheric scenes.

## Tech Stack

- **Game Engine**: Phaser 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **Art Generation**: Maginary API

## Setup

```bash
# Install dependencies
npm install

# Copy environment template and add your API key
cp .env.example .env

# Run development server
npm run dev
```

## Art Generation

Generate character and background art using the Maginary API:

```bash
# Set your API key
export MAGINARY_API_KEY='your-key-here'

# Generate all assets
python scripts/generate_art.py --all

# Generate specific asset
python scripts/generate_art.py --type tank
python scripts/generate_art.py --type pig
python scripts/generate_art.py --type deer
python scripts/generate_art.py --type forest
python scripts/generate_art.py --type group
```

## Project Structure

```
tank-adventure-game/
├── src/
│   ├── main.ts              # Game entry point
│   └── scenes/
│       ├── BootScene.ts     # Initial loading
│       ├── PreloadScene.ts  # Asset loading
│       ├── TitleScene.ts    # Title screen
│       └── BrazilForestScene.ts  # First playable scene
├── assets/
│   ├── images/
│   │   ├── characters/      # Character sprites
│   │   └── backgrounds/     # Scene backgrounds
│   ├── audio/               # Sound effects and music
│   └── sprites/             # Sprite sheets
├── scripts/
│   └── generate_art.py      # Maginary API art generator
└── docs/
    └── story.md             # Full story and character details
```

## Characters

- **Tank**: Athletic martial artist in red gi. Strong, confident, hilariously oblivious.
- **Western Pig**: Pink pig in cowboy hat. Loyal companion with charm and wisdom.
- **Mr. Snuggles**: Gentle deer with kind eyes. Sweet and trusting forest friend.

## Credits

- Story by Alexander Brown
- Game development by Alex Brown & Alexander Brown
