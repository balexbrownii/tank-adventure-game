#!/usr/bin/env python3
"""
Generate pixel art sprite sheets with walk cycles using Pixellab API.
Simple approach: Generate 4 frame poses and combine into sprite sheet.
"""

import requests
import base64
import json
from pathlib import Path
import os
from PIL import Image
import io

# API Configuration
API_BASE = "https://api.pixellab.ai/v1"
API_KEY = os.environ.get("PIXELLAB_API_KEY", "b1d103f1-c963-41e4-9d48-4662e0ead6aa")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

OUTPUT_DIR = Path(__file__).parent.parent / "public/assets/images/characters/sprites"


def check_balance():
    """Check API balance before generating."""
    resp = requests.get(f"{API_BASE}/balance", headers=HEADERS)
    if resp.status_code == 200:
        balance = resp.json()
        print(f"API Balance: ${balance.get('balance', 'unknown')}")
        return balance
    else:
        print(f"Failed to check balance: {resp.status_code}")
        return None


def generate_sprite(description: str, size: int = 64, seed: int | None = None) -> bytes | None:
    """Generate a single sprite from text description."""
    payload = {
        "description": description,
        "image_size": {"width": size, "height": size},
        "no_background": True,
    }
    if seed is not None:
        payload["seed"] = seed

    resp = requests.post(f"{API_BASE}/generate-image-pixflux", headers=HEADERS, json=payload)

    if resp.status_code == 200:
        data = resp.json()
        if "image" in data:
            img_data = data["image"]
            if isinstance(img_data, dict) and "base64" in img_data:
                return base64.b64decode(img_data["base64"])
            elif isinstance(img_data, str):
                return base64.b64decode(img_data)

    print(f"Failed: {resp.status_code} - {resp.text[:100]}")
    return None


def generate_walk_cycle(name: str, base_description: str, size: int = 64) -> list[bytes]:
    """Generate 4-frame walk cycle by describing different poses."""
    poses = [
        f"{base_description}, standing idle pose, side view, pixel art",
        f"{base_description}, walking left leg forward, side view, pixel art",
        f"{base_description}, standing idle pose, side view, pixel art",
        f"{base_description}, walking right leg forward, side view, pixel art",
    ]

    frames = []
    # Use same seed for consistency
    base_seed = hash(name) % 100000

    for i, pose_desc in enumerate(poses):
        print(f"  Frame {i+1}/4: {pose_desc[:50]}...")
        # Use slightly different seeds but same base to keep character consistent
        frame = generate_sprite(pose_desc, size, seed=base_seed + i)
        if frame:
            frames.append(frame)
        else:
            print(f"  Warning: Failed to generate frame {i+1}")

    return frames


def save_sprite_sheet(frames: list[bytes], name: str, frame_size: int = 64) -> Path | None:
    """Combine frames into a horizontal sprite sheet and save."""
    if not frames:
        print(f"No frames to save for {name}")
        return None

    # Load all frames as PIL images
    pil_frames = []
    for frame_bytes in frames:
        img = Image.open(io.BytesIO(frame_bytes))
        pil_frames.append(img)

    # Create horizontal sprite sheet
    sheet_width = frame_size * len(pil_frames)
    sheet_height = frame_size
    sheet = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))

    for i, frame in enumerate(pil_frames):
        # Resize if needed
        if frame.size != (frame_size, frame_size):
            frame = frame.resize((frame_size, frame_size), Image.LANCZOS)
        sheet.paste(frame, (i * frame_size, 0))

    # Save sprite sheet
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{name}_walk.png"
    sheet.save(output_path, "PNG")
    print(f"  Saved: {output_path}")

    # Also save metadata for Phaser
    metadata = {
        "name": name,
        "frameWidth": frame_size,
        "frameHeight": frame_size,
        "frameCount": len(pil_frames),
        "animations": {
            "idle": {
                "frames": [0],
                "frameRate": 1,
                "repeat": 0
            },
            "walk": {
                "frames": [0, 1, 2, 3],
                "frameRate": 8,
                "repeat": -1
            }
        }
    }
    meta_path = OUTPUT_DIR / f"{name}_walk.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved: {meta_path}")

    return output_path


def generate_character(name: str, description: str, size: int = 64):
    """Generate a character with walk cycle sprite sheet."""
    print(f"\n{'='*50}")
    print(f"Generating: {name}")
    print(f"{'='*50}")

    frames = generate_walk_cycle(name, description, size)

    if len(frames) >= 2:
        save_sprite_sheet(frames, name, size)
        print(f"  Success! Generated {len(frames)} frames")
    else:
        print(f"  Failed - only got {len(frames)} frames")


def main():
    # Check balance first
    check_balance()

    # Character definitions - detailed pixel art descriptions
    characters = [
        {
            "name": "tarzan",
            "description": "muscular young man with long brown hair, leopard print loincloth, barefoot jungle hero"
        },
        {
            "name": "pig",
            "description": "cute small pink cartoon pig, round body, friendly farm animal"
        },
        {
            "name": "mr_snuggles",
            "description": "friendly brown deer with small antlers, cute forest animal companion"
        }
    ]

    for char in characters:
        generate_character(char["name"], char["description"], size=64)

    print("\n" + "="*50)
    print("Sprite generation complete!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("="*50)


if __name__ == "__main__":
    main()
