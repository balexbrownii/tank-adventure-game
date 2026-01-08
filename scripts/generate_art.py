#!/usr/bin/env python3
"""
Tank's Great Adventure - Art Generation Script
Generates character and background art using the Maginary API.

Usage:
    python scripts/generate_art.py [--type TYPE] [--all]

Options:
    --type TYPE   Generate specific asset: tank, pig, deer, forest, group
    --all         Generate all assets
"""

import os
import sys
import time
import json
import argparse
import requests
from pathlib import Path

# API Configuration
API_BASE = "https://app.maginary.ai/api/gens/"
API_KEY = os.getenv("MAGINARY_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Output directories
PROJECT_ROOT = Path(__file__).parent.parent
IMAGES_DIR = PROJECT_ROOT / "public" / "assets" / "images"
CHARACTERS_DIR = IMAGES_DIR / "characters"
BACKGROUNDS_DIR = IMAGES_DIR / "backgrounds"
OBJECTS_DIR = IMAGES_DIR / "objects"

# Character prompts (King's Quest V/Monkey Island 2 style)
PROMPTS = {
    "tank": """Video game character art of Tank, a heroic female martial artist. Athletic muscular woman in her late 20s with confident determined expression. She wears a weathered red sleeveless martial arts gi top with black belt, dark cargo pants, wrapped forearms, practical combat boots. Dark hair pulled back in a ponytail. Strong arms showing defined muscles. Standing in a confident martial arts ready stance with fists raised. Full body view, dynamic pose showing she's ready for action. Style: Hand-painted 1990s adventure game art like King's Quest V, Monkey Island 2. Rich saturated colors, detailed painterly brushwork, warm dramatic lighting. Professional video game character illustration, high detail, expressive.""",

    "pig": """Video game character art of a cartoon pig sidekick wearing cowboy gear. Pink pig standing semi-upright on hind legs. Wearing a worn brown leather cowboy hat tilted rakishly, red bandana around neck, small leather vest. Front hooves on hips in confident pose. Friendly expressive face with a knowing smirk and warm eyes. He's a loyal companion with personality and Western charm. Full body character design. Style: Hand-painted 1990s adventure game art like King's Quest, Monkey Island. Warm colors, detailed but charming cartoon style, personality-filled character design.""",

    "deer": """Video game character art of Mr. Snuggles, a friendly deer companion. Young white-tailed deer with gentle kind eyes and sweet trusting expression. Small velvet antlers, soft brown fur with white spots on back. Standing in relaxed pose, head slightly tilted as if listening. Looks approachable and loyal, like a gentle forest friend. Cuddly and friendly appearance matching his name. Full body view in forest lighting. Style: Hand-painted 1990s Sierra adventure game art like King's Quest. Naturalistic but expressive, warm forest lighting, detailed fur texture.""",

    "forest": """Video game background scene of a lush Brazilian rainforest. Dense jungle with towering trees, thick canopy filtering golden afternoon sunlight. Tropical flowers, giant ferns, and hanging vines. A small dirt clearing with a path leading deeper into the jungle. Colorful parrots in the trees, butterflies floating in sunbeams. Rich emerald greens, golden light rays, humid atmospheric depth. Style: 1990s Sierra adventure game background art like King's Quest V or VI. Hand-painted look, detailed foliage, atmospheric perspective. Widescreen game scene composition with clear walkable foreground area.""",

    "forest-interactive": """Video game background scene of a Brazilian rainforest clearing with interactive elements.

    LEFT SIDE: A striking bright red exotic flower on a tall stem, clearly visible and pickable, growing among ferns.

    CENTER-RIGHT FOREGROUND: An old weathered tree stump with a rusty machete blade stuck in the top, handle pointing up. The stump is mossy and about waist-height.

    RIGHT SIDE: Thick tangled jungle vines hanging down like a curtain, blocking a narrow dirt path that leads deeper into the jungle. The vines are dense and clearly impassable without cutting.

    The clearing has a dirt floor with tropical plants. Golden afternoon sunlight filters through the canopy. Dense jungle trees in the background.

    Style: Hand-painted 1990s Sierra adventure game background like King's Quest V or Monkey Island 2. Rich saturated colors, detailed painterly look, atmospheric perspective. Widescreen game scene, 16:9 aspect ratio composition. The three interactive elements (flower, stump with machete, vines) should be clearly visible and distinct from the background.""",

    "group": """Three adventure game characters standing together as a team: Tank (athletic muscular woman in red martial arts gi with black belt, confident heroic pose, dark ponytail), a pink pig wearing cowboy hat and red bandana standing on hind legs with charming smirk, and Mr. Snuggles the deer with small antlers and gentle kind eyes. They stand together in a forest clearing as companions ready for adventure. Warm golden sunlight filtering through trees behind them. Style: Hand-painted 1990s adventure game art like King's Quest or Monkey Island. Character group shot, rich colors, heroic and charming feeling.""",

    # Interactive object sprites
    "stump": """Video game object sprite of an old tree stump with a rusty machete stuck in it. Weathered moss-covered tree stump in a jungle setting. An old rusty machete blade is wedged into the top of the stump, handle sticking up invitingly. The stump is about waist-height, wide and solid. Tropical plants and ferns around the base. Object is clearly interactive and important. Isolated object on transparent or simple background. Style: Hand-painted 1990s Sierra adventure game art like King's Quest V. Detailed painterly texture, warm jungle lighting, game asset sprite.""",

    "vines": """Video game object sprite of thick jungle vines blocking a path. Dense tangled mass of green tropical vines hanging down and across, forming a natural barrier. Some vines have large leaves, others are woody and thick. Clearly too dense to push through without cutting. The vines span across like a curtain blocking passage. Isolated object on transparent or simple background. Style: Hand-painted 1990s Sierra adventure game art. Rich greens, detailed foliage texture, game obstacle sprite.""",

    "flower-sprite": """Video game object sprite of a beautiful exotic tropical flower. Single striking red flower with large vibrant petals, bright yellow center with visible stamens. Long green stem with a few leaves. The flower is eye-catching and clearly pickable. Rainforest orchid or heliconia style. Isolated object on transparent or simple background. Style: Hand-painted 1990s Sierra adventure game art like King's Quest. Vivid saturated colors, detailed botanical illustration style, collectible game item sprite."""
}

# Map asset types to output directories
OUTPUT_DIRS = {
    "tank": CHARACTERS_DIR,
    "pig": CHARACTERS_DIR,
    "deer": CHARACTERS_DIR,
    "forest": BACKGROUNDS_DIR,
    "forest-interactive": BACKGROUNDS_DIR,
    "group": CHARACTERS_DIR,
    "stump": OBJECTS_DIR,
    "vines": OBJECTS_DIR,
    "flower-sprite": OBJECTS_DIR,
}


def ensure_directories():
    """Create output directories if they don't exist."""
    CHARACTERS_DIR.mkdir(parents=True, exist_ok=True)
    BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
    OBJECTS_DIR.mkdir(parents=True, exist_ok=True)


def create_generation(prompt: str) -> str:
    """Create a new image generation request. Returns the UUID."""
    response = requests.post(
        API_BASE,
        json={"prompt": prompt},
        headers=HEADERS
    )
    response.raise_for_status()
    data = response.json()
    return data.get("uuid")


def poll_generation(uuid: str, max_attempts: int = 60, delay: int = 5) -> dict:
    """Poll until generation is complete. Returns the generation data."""
    url = f"{API_BASE}{uuid}/"

    for attempt in range(max_attempts):
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        status = data.get("processing_state", "")
        if status == "done":
            return data
        elif status == "failed":
            result = data.get("processing_result", {})
            raise Exception(f"Generation failed: {result.get('error_message', 'Unknown error')}")

        print(f"  Status: {status} (attempt {attempt + 1}/{max_attempts})")
        time.sleep(delay)

    raise TimeoutError(f"Generation did not complete after {max_attempts * delay} seconds")


def download_image(url: str, output_path: Path) -> None:
    """Download an image from URL to local path."""
    response = requests.get(url, stream=True)
    response.raise_for_status()

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


def generate_asset(asset_type: str) -> None:
    """Generate a single asset type."""
    if asset_type not in PROMPTS:
        print(f"Unknown asset type: {asset_type}")
        print(f"Available types: {', '.join(PROMPTS.keys())}")
        return

    prompt = PROMPTS[asset_type]
    output_dir = OUTPUT_DIRS[asset_type]
    output_path = output_dir / f"{asset_type}.png"

    print(f"\nGenerating: {asset_type}")
    print(f"Output: {output_path}")

    # Create generation
    print("  Creating generation request...")
    uuid = create_generation(prompt)
    print(f"  UUID: {uuid}")

    # Poll for completion
    print("  Waiting for generation...")
    data = poll_generation(uuid)

    # Download first image from slots
    result = data.get("processing_result", {})
    slots = result.get("slots", [])
    if not slots:
        print("  ERROR: No images returned")
        return

    # Find first successful slot
    image_url = None
    for slot in slots:
        if slot.get("status") == "success":
            image_url = slot.get("url")
            break

    if not image_url:
        print("  ERROR: No successful image URL in response")
        return

    print(f"  Downloading image...")
    download_image(image_url, output_path)
    print(f"  SUCCESS: Saved to {output_path}")

    # Save metadata
    metadata_path = output_dir / f"{asset_type}_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump({
            "uuid": uuid,
            "prompt": prompt,
            "slots": slots,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Generate art for Tank's Great Adventure")
    parser.add_argument("--type", choices=list(PROMPTS.keys()), help="Asset type to generate")
    parser.add_argument("--all", action="store_true", help="Generate all assets")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: MAGINARY_API_KEY environment variable not set")
        print("Set it with: export MAGINARY_API_KEY='your-key-here'")
        sys.exit(1)

    ensure_directories()

    if args.all:
        for asset_type in PROMPTS.keys():
            generate_asset(asset_type)
    elif args.type:
        generate_asset(args.type)
    else:
        parser.print_help()
        print("\nAvailable asset types:")
        for name in PROMPTS.keys():
            print(f"  - {name}")


if __name__ == "__main__":
    main()
