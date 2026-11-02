"""Generate the marketplace tile icon for dsh-theme-matrix-glass.

Market rules (awesome-dsh-plugin contributing.md, "Icon"): a GitHub-hosted
RASTER image (png/jpg/jpeg/webp), drawn at ~96 px, square reads best; SVG and
third-party image hosts are refused. So this draws the same artwork as
icon.svg, as a 192x192 PNG with a transparent-safe dark tile.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZE = 192
SS = 4  # supersample factor, downscale at the end for clean edges
HUE = (37, 255, 148)  # matrix green
BRIGHT = (226, 255, 240)
OUT = Path(__file__).resolve().parent.parent / "assets" / "icon-market.png"


def find_font() -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/consolab.ttf",
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/menlo.ttc",
        "C:/Windows/Fonts/dejavu-sans-mono.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, 22 * SS)
            except OSError:
                continue
    return ImageFont.load_default()


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def glyph_alpha(index: int, tail: int) -> float:
    """Tail fade matching the live rain engine: pow(1 - i/tail, 1.7)."""
    if index == 0:
        return 1.0
    return max(0.0, (1.0 - index / tail) ** 1.7)


def draw() -> Image.Image:
    canvas = Image.new("RGBA", (SIZE * SS, SIZE * SS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    font = find_font()

    # Tile: dark rounded square with a near-black green wash, same as the theme base.
    radius = 26 * SS
    draw.rounded_rectangle(
        [2 * SS, 2 * SS, SIZE * SS - 2 * SS, SIZE * SS - 2 * SS],
        radius=radius,
        fill=(4, 18, 12, 255),
    )

    # Three falling streams of 0/1, each with a bright head and a fading tail.
    streams = [
        {"x": 30, "start": 4, "tail": 7, "seed": 1},
        {"x": 74, "start": 12, "tail": 6, "seed": 2},
        {"x": 118, "start": 2, "tail": 8, "seed": 3},
        {"x": 152, "start": 22, "tail": 5, "seed": 4},
    ]
    line_h = 26
    for stream in streams:
        for i in range(stream["tail"]):
            y = stream["start"] + i * line_h
            if y + line_h > SIZE:
                break
            alpha = glyph_alpha(i, stream["tail"])
            glyph = "1" if (stream["seed"] * 31 + i * 7) % 2 == 0 else "0"
            if i == 0:
                colour = (BRIGHT[0], BRIGHT[1], BRIGHT[2], 255)
                # head glow: a soft block behind the head glyph
                glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
                glow_draw = ImageDraw.Draw(glow)
                glow_draw.rounded_rectangle(
                    [(stream["x"] - 6) * SS, y * SS, (stream["x"] + 20) * SS, (y + line_h - 4) * SS],
                    radius=4 * SS,
                    fill=(HUE[0], HUE[1], HUE[2], 70),
                )
                canvas = Image.alpha_composite(canvas, glow)
                draw = ImageDraw.Draw(canvas)
            else:
                strength = 0.35 + 0.65 * alpha
                colour = (
                    lerp(10, HUE[0], strength),
                    lerp(70, HUE[1], strength),
                    lerp(45, HUE[2], strength),
                    int(200 * alpha) + 40,
                )
            draw.text((stream["x"] * SS, (y - 2) * SS), glyph, font=font, fill=colour)

    # Frosted glass panel: a translucent rounded rect crossing the streams.
    glass = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glass_draw = ImageDraw.Draw(glass)
    glass_draw.rounded_rectangle(
        [44 * SS, 70 * SS, 150 * SS, 156 * SS],
        radius=13 * SS,
        fill=(18, 58, 40, 120),
        outline=(HUE[0], HUE[1], HUE[2], 90),
        width=1 * SS,
    )
    glass_draw.rounded_rectangle(
        [44 * SS, 70 * SS, 150 * SS, 100 * SS],
        radius=13 * SS,
        fill=(210, 255, 232, 26),
    )
    canvas = Image.alpha_composite(canvas, glass)
    draw = ImageDraw.Draw(canvas)

    # Hairline frame around the tile.
    draw.rounded_rectangle(
        [2 * SS, 2 * SS, SIZE * SS - 2 * SS, SIZE * SS - 2 * SS],
        radius=radius,
        outline=(HUE[0], HUE[1], HUE[2], 60),
        width=1 * SS,
    )

    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    image = draw()
    image.save(OUT, "PNG")
    print(f"wrote {OUT} {image.size[0]}x{image.size[1]} {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
