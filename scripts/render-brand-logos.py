from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path('assets/brand')
OUT.mkdir(parents=True, exist_ok=True)
WEIBEI = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/c745f84f5eb15b1f594d3769dc86146fccee61ff.asset/AssetData/WeibeiSC-Bold.otf'
LANTING = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/f14049099a04e570b893c01d9a4cd71f87c9e8d8.asset/AssetData/Lantinghei.ttc'


def gradient(size, stops):
    w, h = size
    img = Image.new('RGBA', size)
    px = img.load()
    for x in range(w):
        t = x / max(1, w - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                u = (t - p0) / max(1e-6, p1 - p0)
                c = tuple(round(c0[j] * (1 - u) + c1[j] * u) for j in range(4))
                break
        else:
            c = stops[-1][1]
        for y in range(h):
            px[x, y] = c
    return img


def text_mask(text, font, canvas, xy, stroke=0):
    mask = Image.new('L', canvas, 0)
    d = ImageDraw.Draw(mask)
    d.text(xy, text, font=font, fill=255, stroke_width=stroke, stroke_fill=255)
    return mask


def draw_gradient_text(base, text, font, xy, fill_stops, stroke_width=8, stroke_fill=(246, 253, 247, 255), shadow=True):
    w, h = base.size
    if shadow:
        sh = text_mask(text, font, base.size, (xy[0] + 9, xy[1] + 12), stroke_width + 1)
        shadow_img = Image.new('RGBA', base.size, (17, 48, 56, 105))
        base.alpha_composite(Image.composite(shadow_img, Image.new('RGBA', base.size), sh.filter(ImageFilter.GaussianBlur(2.2))))
        sh2 = text_mask(text, font, base.size, (xy[0] + 3, xy[1] + 4), stroke_width)
        shadow_img2 = Image.new('RGBA', base.size, (255, 255, 255, 170))
        base.alpha_composite(Image.composite(shadow_img2, Image.new('RGBA', base.size), sh2.filter(ImageFilter.GaussianBlur(0.4))))
    d = ImageDraw.Draw(base)
    d.text(xy, text, font=font, fill=stroke_fill, stroke_width=stroke_width, stroke_fill=stroke_fill)
    mask = text_mask(text, font, base.size, xy, 0)
    base.alpha_composite(Image.composite(gradient(base.size, fill_stops), Image.new('RGBA', base.size), mask))
    # bevel highlight clipped to the top half of the glyphs
    top = Image.new('L', base.size, 0)
    ImageDraw.Draw(top).rectangle((0, 0, w, h * 0.53), fill=150)
    hi = Image.new('RGBA', base.size, (255, 255, 255, 82))
    base.alpha_composite(Image.composite(hi, Image.new('RGBA', base.size), Image.composite(top, Image.new('L', base.size), mask)))


def crop_alpha(img, pad=10):
    box = img.getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad); y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def weather_logo():
    font = ImageFont.truetype(WEIBEI, 124)
    img = Image.new('RGBA', (900, 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Mountain and forest strokes tucked into the wordmark instead of a separate icon.
    d.polygon([(520, 156), (574, 58), (612, 116), (648, 44), (734, 156)], fill=(212, 238, 222, 230), outline=(63, 104, 77, 255))
    for x, y, h in [(604, 82, 78), (636, 92, 68), (668, 74, 86)]:
        d.rounded_rectangle((x, y, x + 18, y + h), radius=8, fill=(10, 91, 60, 235))
    draw_gradient_text(
        img, '气象山野', font, (24, 38),
        [(0, (0, 105, 160, 255)), (0.38, (24, 150, 170, 255)), (0.62, (6, 106, 69, 255)), (1, (111, 101, 50, 255))],
        stroke_width=8,
    )
    d.arc((140, 18, 248, 90), 190, 540, fill=(222, 249, 255, 240), width=10)
    d.line([(44, 168), (180, 178), (324, 174), (486, 162)], fill=(17, 69, 78, 78), width=5)
    out = crop_alpha(img, 14)
    out.save(OUT / 'weather-wordmark.png')


def route_logo():
    try:
        font = ImageFont.truetype(LANTING, 122, index=8)
    except Exception:
        font = ImageFont.truetype(LANTING, 122)
    img = Image.new('RGBA', (1000, 220), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_gradient_text(
        img, '路线决策台', font, (18, 42),
        [(0, (0, 92, 145, 255)), (0.28, (0, 125, 174, 255)), (0.45, (201, 112, 16, 255)), (0.66, (0, 88, 136, 255)), (1, (72, 84, 92, 255))],
        stroke_width=7,
    )
    # Compass and route graph integrated around the last two characters.
    cx, cy = 704, 58
    d.line([(cx, cy + 64), (cx + 32, cy), (cx + 64, cy + 64)], fill=(31, 104, 141, 230), width=6)
    d.line([(cx + 32, cy), (cx + 32, cy + 94)], fill=(201, 112, 16, 245), width=7)
    pts = [(684, 158), (746, 136), (804, 171), (866, 140), (940, 164)]
    d.line(pts, fill=(38, 62, 70, 220), width=5, joint='curve')
    for x, y in pts:
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(201, 112, 16, 255), outline=(255, 248, 232, 255), width=3)
    out = crop_alpha(img, 14)
    out.save(OUT / 'route-wordmark.png')


if __name__ == '__main__':
    weather_logo()
    route_logo()
    print('rendered', OUT / 'weather-wordmark.png', OUT / 'route-wordmark.png')
