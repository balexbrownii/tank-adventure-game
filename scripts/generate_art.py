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

# Hi-bit pixel art prompts (Killer Rabbit Media style)
PROMPTS = {
    "title-screen": """Hi-bit pixel art title screen for a jungle adventure game. Epic cinematic composition showing a dramatic Brazilian rainforest at sunset. Silhouette of a heroic Tarzan-like figure standing on a cliff or tree branch overlooking the vast jungle canopy. Golden orange sunset sky with rich color gradients using detailed dithering. Deep jungle stretching to the horizon with atmospheric depth and haze. Moody, cinematic lighting with god rays filtering through clouds. Style: Modern hi-bit pixel art like Killer Rabbit Media or Superbrothers. NOT retro 8-bit - this is professional illustration-quality pixel art with visible but refined pixels, smooth dithered gradients, atmospheric lighting, cinematic mood. Rich color palette, detailed shading. 16:9 widescreen composition.""",

    "tarzan": """Hi-bit pixel art character sprite of Tarzan, a heroic jungle man. Athletic muscular man with wild dark hair, confident pose. Simple jungle attire - loincloth, bare chest, bare feet. Tanned skin. Standing heroic pose ready for adventure. Full body view. Style: Modern hi-bit pixel art with visible but refined pixels. Rich colors, detailed shading with dithering, NOT retro 8-bit. Professional quality like modern indie games. Isolated on transparent background.""",

    "tank": """Hi-bit pixel art character of Tank, heroic female martial artist. Athletic woman in red martial arts gi with black belt, dark cargo pants, ponytail. Confident fighting stance. Full body view. Style: Modern hi-bit pixel art, visible refined pixels, rich shading, professional quality. Transparent background.""",

    "pig": """Hi-bit pixel art character of a cartoon pig sidekick in cowboy gear. Pink pig standing on hind legs, brown cowboy hat, red bandana, leather vest. Friendly smirk, charming personality. Full body. Style: Modern hi-bit pixel art with detailed shading, refined pixels, warm colors. Transparent background.""",

    "deer": """Hi-bit pixel art character of Mr. Snuggles, a friendly deer companion. Young deer with gentle eyes, small antlers, brown fur with white spots. Relaxed friendly pose. Full body. Style: Modern hi-bit pixel art, refined pixels, warm natural lighting, detailed fur texture. Transparent background.""",

    "forest": """Hi-bit pixel art scene of a lush Brazilian rainforest. Dense jungle with towering trees, thick canopy filtering golden afternoon sunlight through gaps. Tropical flowers, giant ferns, hanging vines. Small dirt clearing with path leading deeper into jungle. Rich emerald greens, golden light rays piercing through, humid atmospheric depth with layered fog. Style: Modern hi-bit pixel art like Killer Rabbit Media. NOT retro 8-bit - professional illustration-quality pixel art with visible refined pixels, smooth dithered color gradients, atmospheric lighting, cinematic depth. Rich saturated colors, moody jungle atmosphere. 16:9 widescreen game background.""",

    "forest-interactive": """Hi-bit pixel art scene of Brazilian rainforest clearing with interactive game elements.

    LEFT SIDE: Striking bright red exotic flower on tall stem, clearly visible and pickable among ferns.

    CENTER-RIGHT FOREGROUND: Old weathered tree stump, mossy, waist-height. Stump is EMPTY - no machete, just old cut stump with moss and wood grain.

    RIGHT SIDE: Thick tangled jungle vines hanging like curtain, blocking narrow path. Dense and impassable without cutting.

    Dirt floor clearing with tropical plants. Golden afternoon sunlight through canopy. Dense jungle background.

    Style: Modern hi-bit pixel art like Killer Rabbit Media. Professional illustration-quality with visible refined pixels, dithered gradients, atmospheric lighting. Interactive elements clearly visible and distinct. 16:9 widescreen composition.""",

    "group": """Hi-bit pixel art group shot of adventure team: Tarzan (athletic jungle man), pink pig in cowboy gear, and Mr. Snuggles the deer. Standing together in forest clearing as companions. Warm golden sunlight filtering through trees. Style: Modern hi-bit pixel art, refined pixels, rich colors, heroic composition.""",

    # Interactive object sprites - hi-bit style
    "stump": """Hi-bit pixel art sprite of old jungle tree stump. Weathered moss-covered stump, waist-height, solid wood. Tropical plants at base. Clearly interactive game object. Style: Modern hi-bit pixel art with refined pixels, detailed texture, warm jungle lighting. Transparent background. NOT retro 8-bit.""",

    "vines": """Hi-bit pixel art sprite of thick jungle vines blocking path. Dense tangled green vines hanging down forming natural barrier. Large leaves, woody thick vines. Impassable obstacle. Style: Modern hi-bit pixel art, refined pixels, rich greens, detailed foliage texture. Transparent background.""",

    "flower-sprite": """Hi-bit pixel art sprite of exotic tropical flower. Single striking red flower with vibrant petals, yellow center, green stem with leaves. Eye-catching collectible item. Style: Modern hi-bit pixel art, refined pixels, vivid saturated colors, detailed botanical style. Transparent background.""",

    "machete-stump": """Hi-bit pixel art sprite of rusty machete stuck in tree stump. Weathered wooden handle pointing up, rusty metal blade wedged in mossy stump top. Interactive game item. Style: Modern hi-bit pixel art, refined pixels, muted earth tones, detailed texture. Transparent background.""",

    "village": """Hi-bit pixel art scene of small indigenous Brazilian village in jungle clearing.

    Several thatched-roof huts of wood and palm leaves in semi-circle. Central fire pit with rising smoke and warm glow. Colorful woven blankets and pottery near huts. Tropical plants and palms framing scene.

    LEFT: Trading post with wooden table displaying tools - stone axes, bowls, baskets, beaded jewelry.

    CENTER: Village clearing with packed dirt. Friendly indigenous trader near table in traditional clothing with feathers.

    RIGHT: Path leading back into jungle.

    Warm afternoon light through canopy. Peaceful welcoming atmosphere. Fire casting warm orange glow.

    Style: Modern hi-bit pixel art like Killer Rabbit Media. Professional illustration-quality with visible refined pixels, smooth dithered gradients, atmospheric warm lighting, cinematic mood. Rich saturated colors. 16:9 widescreen composition."""
}

# Map asset types to output directories
OUTPUT_DIRS = {
    "title-screen": BACKGROUNDS_DIR,
    "tarzan": CHARACTERS_DIR,
    "tank": CHARACTERS_DIR,
    "pig": CHARACTERS_DIR,
    "deer": CHARACTERS_DIR,
    "forest": BACKGROUNDS_DIR,
    "forest-interactive": BACKGROUNDS_DIR,
    "village": BACKGROUNDS_DIR,
    "group": CHARACTERS_DIR,
    "stump": OBJECTS_DIR,
    "vines": OBJECTS_DIR,
    "flower-sprite": OBJECTS_DIR,
    "machete-stump": OBJECTS_DIR,
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
