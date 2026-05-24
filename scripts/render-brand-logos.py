from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path('assets/brand')
OUT.mkdir(parents=True, exist_ok=True)
FONT_PATH = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/f14049099a04e570b893c01d9a4cd71f87c9e8d8.asset/AssetData/Lantinghei.ttc'
FONT_INDEX = 2

def gradient(size, stops):
    w, h = size
    img = Image.new('RGBA', size)
    px = img.load()
    for x in range(w):
        t = x / max(1, w - 1)
        c = stops[-1][1]
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= t <= b:
                u = (t - a) / max(1e-6, b - a)
                c = tuple(round(ca[i] * (1 - u) + cb[i] * u) for i in range(4))
                break
        for y in range(h):
            px[x, y] = c
    return img

def mask_text(size, txt, font, xy, stroke=0):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    d.text(xy, txt, font=font, fill=255, stroke_width=stroke, stroke_fill=255)
    return m

def draw_word(canvas, text, font, xy, stops):
    size = canvas.size
    d = ImageDraw.Draw(canvas)
    for dx, dy, blur, col in [
        (6, 8, 2.0, (8, 88, 116, 90)),
        (3, 4, 0.8, (15, 134, 178, 140)),
    ]:
        m = mask_text(size, text, font, (xy[0] + dx, xy[1] + dy), stroke=8)
        sh = Image.new('RGBA', size, col)
        canvas.alpha_composite(Image.composite(sh, Image.new('RGBA', size), m.filter(ImageFilter.GaussianBlur(blur))))
    d.text(xy, text, font=font, fill=(245, 253, 250, 255), stroke_width=9, stroke_fill=(245, 253, 250, 255))
    d.text(xy, text, font=font, fill=(20, 128, 165, 255), stroke_width=7, stroke_fill=(20, 128, 165, 255))
    m = mask_text(size, text, font, xy, 0)
    canvas.alpha_composite(Image.composite(gradient(size, stops), Image.new('RGBA', size), m))
    top = Image.new('L', size, 0)
    ImageDraw.Draw(top).rectangle((0, 0, size[0], int(size[1] * 0.45)), fill=90)
    gloss = Image.new('RGBA', size, (255, 255, 255, 84))
    canvas.alpha_composite(Image.composite(gloss, Image.new('RGBA', size), Image.composite(top, Image.new('L', size), m)))

def crop_alpha(img, pad=10):
    box = img.getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))

def weather():
    font = ImageFont.truetype(FONT_PATH, 116, index=FONT_INDEX)
    img = Image.new('RGBA', (900, 220), (0, 0, 0, 0))
    draw_word(img, '气象山野', font, (18, 36), [
        (0.00, (44, 162, 240, 255)),
        (0.35, (74, 219, 248, 255)),
        (0.62, (35, 190, 144, 255)),
        (1.00, (126, 202, 82, 255)),
    ])
    d = ImageDraw.Draw(img)
    d.polygon([(550, 146), (595, 62), (627, 114), (665, 50), (744, 146)], fill=(223, 251, 236, 246), outline=(40, 171, 118, 255))
    for x, h in [(628, 58), (655, 74), (684, 64)]:
        d.rounded_rectangle((x, 146 - h, x + 20, 146), radius=8, fill=(12, 166, 111, 250))
    d.arc((139, 21, 236, 86), 190, 535, fill=(231, 254, 255, 247), width=9)
    crop_alpha(img, 14).save(OUT / 'weather-wordmark.png')

def route():
    font = ImageFont.truetype(FONT_PATH, 116, index=FONT_INDEX)
    img = Image.new('RGBA', (980, 220), (0, 0, 0, 0))
    draw_word(img, '路径决策台', font, (16, 36), [
        (0.00, (42, 151, 242, 255)),
        (0.30, (66, 208, 250, 255)),
        (0.48, (255, 180, 38, 255)),
        (0.68, (46, 169, 239, 255)),
        (1.00, (92, 181, 226, 255)),
    ])
    d = ImageDraw.Draw(img)
    ox, oy = 706, 31
    d.line([(ox + 32, oy), (ox + 3, oy + 67)], fill=(49, 167, 246, 244), width=6)
    d.line([(ox + 32, oy), (ox + 61, oy + 67)], fill=(49, 167, 246, 244), width=6)
    d.line([(ox + 32, oy), (ox + 32, oy + 90)], fill=(255, 178, 36, 255), width=7)
    pts = [(672, 161), (725, 140), (781, 171), (844, 138), (918, 165)]
    d.line(pts, fill=(53, 132, 184, 242), width=5)
    for x, y in pts:
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(255, 180, 38, 255), outline=(251, 251, 243, 255), width=3)
    crop_alpha(img, 14).save(OUT / 'route-wordmark.png')

if __name__ == '__main__':
    weather(); route(); print('ok')
