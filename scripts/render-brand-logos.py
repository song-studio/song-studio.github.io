from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path('assets/brand')
OUT.mkdir(parents=True, exist_ok=True)
LANTING = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/f14049099a04e570b893c01d9a4cd71f87c9e8d8.asset/AssetData/Lantinghei.ttc'
FONT_INDEX_HEAVY_SC = 2


def make_gradient(size, stops):
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


def mask_text(size, text, font, xy, stroke=0):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    d.text(xy, text, font=font, fill=255, stroke_width=stroke, stroke_fill=255)
    return m


def draw_brand_text(img, text, font, xy, stops, stroke=8):
    size = img.size
    # Deep extruded shadow, close to the user's reference image but cleaner.
    for off, blur, alpha in [((7, 9), 2.2, 95), ((4, 5), 0.8, 135), ((0, 1), 0.2, 230)]:
        m = mask_text(size, text, font, (xy[0] + off[0], xy[1] + off[1]), stroke)
        sh = Image.new('RGBA', size, (16, 48, 58, alpha))
        img.alpha_composite(Image.composite(sh, Image.new('RGBA', size), m.filter(ImageFilter.GaussianBlur(blur))))
    # White bevel outline.
    d = ImageDraw.Draw(img)
    d.text(xy, text, font=font, fill=(247, 253, 247, 255), stroke_width=stroke + 2, stroke_fill=(247, 253, 247, 255))
    d.text(xy, text, font=font, fill=(18, 102, 135, 255), stroke_width=stroke, stroke_fill=(18, 102, 135, 255))
    m = mask_text(size, text, font, xy, 0)
    img.alpha_composite(Image.composite(make_gradient(size, stops), Image.new('RGBA', size), m))
    # Top gloss clipped into glyphs.
    gloss = Image.new('L', size, 0)
    gd = ImageDraw.Draw(gloss)
    gd.rectangle((0, 0, size[0], size[1] * 0.45), fill=92)
    img.alpha_composite(Image.composite(Image.new('RGBA', size, (255,255,255,80)), Image.new('RGBA', size), Image.composite(gloss, Image.new('L', size), m)))


def crop(img, pad=10):
    box = img.getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0-pad), max(0, y0-pad), min(img.width, x1+pad), min(img.height, y1+pad)))


def weather_logo():
    font = ImageFont.truetype(LANTING, 116, index=FONT_INDEX_HEAVY_SC)
    img = Image.new('RGBA', (880, 210), (0,0,0,0))
    draw_brand_text(img, '气象山野', font, (18, 36), [
        (0, (0, 132, 210, 255)),
        (0.34, (36, 190, 238, 255)),
        (0.62, (0, 164, 128, 255)),
        (1, (80, 178, 72, 255)),
    ], stroke=8)
    d = ImageDraw.Draw(img)
    # Integrated mountain mark, similar to the reference, but smaller and cleaner.
    d.polygon([(548,145),(594,62),(626,115),(662,50),(740,145)], fill=(218,250,232,248), outline=(24,145,102,255))
    for x,h in [(626,58),(653,74),(681,62)]:
        d.rounded_rectangle((x,145-h,x+20,146), radius=8, fill=(0,139,93,248))
    d.arc((138,20,235,86), 190, 535, fill=(232,253,255,245), width=9)
    d.line([(36,168),(160,176),(330,172),(515,158)], fill=(0,122,150,110), width=4)
    crop(img, 14).save(OUT/'weather-wordmark.png')


def route_logo():
    font = ImageFont.truetype(LANTING, 116, index=FONT_INDEX_HEAVY_SC)
    img = Image.new('RGBA', (970, 210), (0,0,0,0))
    draw_brand_text(img, '路线决策台', font, (16, 36), [
        (0, (0, 96, 210, 255)),
        (0.30, (0, 166, 232, 255)),
        (0.48, (255, 166, 28, 255)),
        (0.68, (0, 132, 205, 255)),
        (1, (40, 106, 150, 255)),
    ], stroke=8)
    d = ImageDraw.Draw(img)
    # Compass plus route graph, like the provided image but with less clutter.
    ox, oy = 704, 31
    d.line([(ox+32, oy), (ox+4, oy+66)], fill=(0,118,220,240), width=6)
    d.line([(ox+32, oy), (ox+61, oy+66)], fill=(0,118,220,240), width=6)
    d.line([(ox+32, oy), (ox+32, oy+88)], fill=(255,166,28,255), width=7)
    pts = [(670,160),(724,140),(780,170),(842,138),(915,164)]
    d.line(pts, fill=(36,84,122,238), width=5)
    for x,y in pts:
        d.ellipse((x-8,y-8,x+8,y+8), fill=(255,166,28,255), outline=(255,248,232,255), width=3)
    crop(img, 14).save(OUT/'route-wordmark.png')

if __name__ == '__main__':
    weather_logo()
    route_logo()
    print('rendered brand PNGs')
