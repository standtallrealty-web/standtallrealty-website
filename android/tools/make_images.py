#!/usr/bin/env python3
"""Make the Android app's launcher icons, splash screen and Play Store images from the website's
own artwork (site/assets/img and site/assets/fonts).

Run from the project root:  python3 android/tools/make_images.py <site-dir> <android-dir> [<store-dir>]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else 'site')
APP = Path(sys.argv[2] if len(sys.argv) > 2 else 'android')
STORE = Path(sys.argv[3]) if len(sys.argv) > 3 else None
RES = APP / 'app/src/main/res'
IMG = SITE / 'assets/img'
FONTS = SITE / 'assets/fonts'

NAVY = (19, 35, 60)          # --navy  #13233C
ICON_BG = (17, 32, 58)       # background of the website's app icon
WHITE = (244, 246, 250)
GOLD = (217, 182, 106)       # --gold  #D9B66A
CREAM = (240, 220, 174)      # --cream #F0DCAE

DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)


def adaptive_foreground(px):
    """108dp adaptive-icon layer. The website's maskable icon is drawn at 80% so the towers stay
    inside the circle that round launchers show (the visible part is the middle 72dp)."""
    src = Image.open(IMG / 'icon-maskable-512.png').convert('RGBA')
    canvas = Image.new('RGBA', (px, px), ICON_BG + (255,))
    inner = round(px * 0.80)
    canvas.alpha_composite(src.resize((inner, inner), Image.LANCZOS), ((px - inner) // 2, (px - inner) // 2))
    return canvas


def legacy_icons():
    square = Image.open(IMG / 'icon-512.png').convert('RGBA')       # rounded square, clear corners
    for d, k in DENSITIES.items():
        px = round(48 * k)
        save(square.resize((px, px), Image.LANCZOS), RES / f'mipmap-{d}/ic_launcher.png')
        big = Image.open(IMG / 'icon-maskable-512.png').convert('RGBA')  # towers sit inside the 80% circle
        mask = Image.new('L', big.size, 0)
        ImageDraw.Draw(mask).ellipse((0, 0, big.size[0] - 1, big.size[1] - 1), fill=255)
        rnd = Image.new('RGBA', big.size, (0, 0, 0, 0))
        rnd.paste(big, (0, 0), mask)
        save(rnd.resize((px, px), Image.LANCZOS), RES / f'mipmap-{d}/ic_launcher_round.png')
        fg = round(108 * k)
        save(adaptive_foreground(fg), RES / f'mipmap-{d}/ic_launcher_foreground.png')


def text_center(draw, y, text, fnt, fill, width, spacing=0):
    if spacing:
        widths = [draw.textlength(c, font=fnt) for c in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = (width - total) / 2
        for c, w in zip(text, widths):
            draw.text((x, y), c, font=fnt, fill=fill)
            x += w + spacing
    else:
        w = draw.textlength(text, font=fnt)
        draw.text(((width - w) / 2, y), text, font=fnt, fill=fill)


def brand_lockup(scale=1.0, with_mark=True):
    """Towers mark, STAND TALL, REALTY and the slogan, on a clear background (like the logo)."""
    W, H = round(840 * scale), round(1000 * scale)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = 0
    if with_mark:
        mark = Image.open(IMG / 'mark.webp').convert('RGBA')
        mh = round(560 * scale)
        mw = round(mark.width * mh / mark.height)
        im.alpha_composite(mark.resize((mw, mh), Image.LANCZOS), ((W - mw) // 2, 0))
        y = mh + round(46 * scale)
    title = font('lora.woff', round(92 * scale))
    text_center(d, y, 'STAND TALL', title, WHITE, W, spacing=round(6 * scale))
    y += round(118 * scale)
    # thin gold rule with a small diamond, like the logo
    cx, half = W / 2, round(150 * scale)
    d.line((cx - half, y, cx - 14 * scale, y), fill=GOLD, width=max(2, round(3 * scale)))
    d.line((cx + 14 * scale, y, cx + half, y), fill=GOLD, width=max(2, round(3 * scale)))
    r = 8 * scale
    d.polygon([(cx, y - r), (cx + r, y), (cx, y + r), (cx - r, y)], fill=GOLD)
    y += round(22 * scale)
    text_center(d, y, 'REALTY', font('inter-600.woff', round(40 * scale)), GOLD, W, spacing=round(14 * scale))
    y += round(84 * scale)
    text_center(d, y, 'Where Your Dreams Stand Tall', font('lora-italic.woff', round(46 * scale)), CREAM, W)
    bbox = im.getbbox()
    return im.crop((0, 0, W, bbox[3] + round(8 * scale)))


def splash():
    # Shown centred at its own size (ImageView CENTER). 3x density: 840px wide = 280dp on any phone.
    save(brand_lockup(1.0), RES / 'drawable-xxhdpi/splash.png')


def store_images():
    if not STORE:
        return
    STORE.mkdir(parents=True, exist_ok=True)
    # Play Store icon: 512 x 512, full square (Google rounds the corners itself).
    Image.open(IMG / 'icon-maskable-512.png').convert('RGB').save(STORE / 'play-icon-512.png', optimize=True)
    # Feature graphic: 1024 x 500.
    W, H = 1024, 500
    fg = Image.new('RGB', (W, H), NAVY)
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((-200, -260, 760, 760), fill=46)
    fg.paste(Image.new('RGB', (W, H), (43, 66, 104)), (0, 0), glow.filter(ImageFilter.GaussianBlur(90)))
    mark = Image.open(IMG / 'mark.webp').convert('RGBA')
    mh = 420
    mw = round(mark.width * mh / mark.height)
    fg.paste(mark.resize((mw, mh), Image.LANCZOS), (70, H - mh - 30), mark.resize((mw, mh), Image.LANCZOS))
    d = ImageDraw.Draw(fg)
    x = 70 + mw + 60
    d.text((x, 120), 'STAND TALL', font=font('lora.woff', 76), fill=WHITE)
    d.text((x + 4, 214), 'R E A L T Y', font=font('inter-600.woff', 30), fill=GOLD)
    d.text((x, 280), 'Buy, sell or rent in Pune', font=font('inter-500.woff', 34), fill=WHITE)
    d.text((x, 330), 'Verified homes. Real people.', font=font('lora-italic.woff', 32), fill=CREAM)
    fg.save(STORE / 'feature-graphic-1024x500.png', optimize=True)


if __name__ == '__main__':
    legacy_icons()
    splash()
    store_images()
    print('done')
