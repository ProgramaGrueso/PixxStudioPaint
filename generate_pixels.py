#!/usr/bin/env python3
import json
import os
from PIL import Image

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
AVATAR_PATH = os.path.join(WORKSPACE_DIR, "avatar.png")

def process_avatar():
    if not os.path.exists(AVATAR_PATH):
        raise FileNotFoundError(f"No se encontró avatar.png en {WORKSPACE_DIR}")

    original = Image.open(AVATAR_PATH).convert("RGB")
    w, h = original.size
    print(f"Imagen original cargada: {w}x{h}")

    # Definir resoluciones objetivo
    resolutions = [32, 64, 128]
    data_output = {}

    for res in resolutions:
        small = original.resize((res, res), Image.Resampling.LANCZOS)
        
        palette_size = 32 if res <= 64 else 48
        quantized = small.quantize(colors=palette_size, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        rgb_quantized = quantized.convert("RGB")

        native_file = os.path.join(WORKSPACE_DIR, f"avatar_pixel_{res}.png")
        preview_file = os.path.join(WORKSPACE_DIR, f"avatar_pixel_{res}_hd.png")
        
        rgb_quantized.save(native_file)
        
        hd_preview = rgb_quantized.resize((1024, 1024), Image.Resampling.NEAREST)
        hd_preview.save(preview_file)
        print(f"Generado {native_file} y {preview_file}")

        pixels = list(rgb_quantized.getdata())
        pixel_grid = []
        palette_set = set()

        for y in range(res):
            row = []
            for x in range(res):
                r, g, b = pixels[y * res + x]
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                row.append(hex_color)
                palette_set.add(hex_color)
            pixel_grid.append(row)

        data_output[str(res)] = {
            "resolution": res,
            "palette": sorted(list(palette_set)),
            "grid": pixel_grid
        }

    json_path = os.path.join(WORKSPACE_DIR, "avatar_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data_output, f, separators=(',', ':'))
    print(f"Datos exportados a {json_path}")

if __name__ == "__main__":
    process_avatar()
