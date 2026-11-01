"""Prepare locally served painted scenery from the credited reference images.

Requires Pillow, NumPy and OpenCV. Actors and original UI are removed so all
on-screen actors, combat, pickups and HUD belong to the live game.
"""
from pathlib import Path
import urllib.request
import cv2
import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public' / 'assets'
REFERENCES = ROOT / 'output' / 'art-sources'
REFERENCES.mkdir(parents=True, exist_ok=True)
SOURCE_BASE = 'https://images.squarespace-cdn.com/content/v1/606d4bb793879d12d807d4c8/'
SOURCE_FILES = {
    'grotto': '5b2edc7f-750c-4bcf-9216-e0cac388a585/01_grotto.png',
    'coral': 'd715d8b6-a0c0-4c48-a405-504f753809df/02_coral.png',
    'moor': 'fcf2e48f-017f-4d53-bb91-6a130b07d8bb/06_greymoor.png',
    'peak': '2998be3f-3d43-4a34-b005-defe3159ae8c/09a_peak.png',
}


def reference(name):
    path = REFERENCES / f'{name}-reference.png'
    if not path.exists():
        legacy = ASSETS / path.name
        if legacy.exists():
            return legacy
        request = urllib.request.Request(SOURCE_BASE + SOURCE_FILES[name], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            path.write_bytes(response.read())
    return path


def prepare(name, target, polygons, saturation=0.86, brightness=1.0):
    image = Image.open(reference(name)).convert('RGB').resize((1600, 900), Image.Resampling.LANCZOS)
    arr = np.array(image)
    mask = np.zeros((900, 1600), dtype=np.uint8)
    for polygon in polygons:
        points = np.array([[round(x * 1600 / 2048), round(y * 900 / 1152)] for x, y in polygon], dtype=np.int32)
        cv2.fillPoly(mask, [points], 255)
    clean = cv2.inpaint(arr, mask, 9, cv2.INPAINT_TELEA)
    blurred = cv2.GaussianBlur(clean, (0, 0), 4)
    blend = cv2.GaussianBlur(mask, (0, 0), 4) / 255
    clean = (clean * (1 - blend[:, :, None]) + blurred * blend[:, :, None]).astype(np.uint8)
    result = ImageEnhance.Color(Image.fromarray(clean)).enhance(saturation)
    result = ImageEnhance.Brightness(result).enhance(brightness)
    result.save(ASSETS / f'{target}.webp', quality=89, method=6)
    print(target, (ASSETS / f'{target}.webp').stat().st_size)


prepare('grotto', 'grotto', [
    [(78, 61), (462, 61), (462, 161), (78, 161)],
    [(86, 179), (225, 179), (225, 228), (86, 228)],
    [(1038, 775), (1222, 777), (1222, 839), (1214, 887), (1147, 934), (1115, 956), (982, 952), (983, 925), (1040, 877)],
], saturation=0.73, brightness=1.02)

prepare('coral', 'coral', [
    [(30, 33), (628, 33), (628, 164), (455, 248), (71, 248), (28, 168)],
    [(457, 367), (686, 367), (695, 705), (458, 705)],
    [(1304, 272), (1528, 272), (1537, 625), (1291, 625)],
    [(841, 767), (1246, 766), (1280, 750), (1544, 749), (1554, 1048), (1291, 1044), (1258, 973), (842, 961)],
], saturation=0.65, brightness=0.83)

prepare('moor', 'peak', [
    [(30, 35), (515, 35), (515, 170), (437, 248), (72, 248), (30, 170)],
    [(913, 729), (1047, 729), (1061, 880), (1083, 946), (929, 948), (901, 841)],
], saturation=0.7, brightness=1.13)

thumb = Image.open(reference('peak')).convert('RGB').resize((800, 450), Image.Resampling.LANCZOS)
thumb.save(ASSETS / 'crown-journal.webp', quality=85)
