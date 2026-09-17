# Обложки и иконка для порталов из кадров portal/kadry: обложки 800×470, 1280×720, 800×800, иконка 512.
# Титул поверх обложки: Arial Bold, 0xffb347 с тёмной обводкой. Рабочее название TUFF до решения Khan'а.
# Запуск: python scripts/oblozhki.py [титул]   (кадры снимаются заранее: kadr-portal.mjs, komnata для героя)
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np

titul = sys.argv[1] if len(sys.argv) > 1 else 'TUFF'
K = 'portal/kadry/'


def shrift(px):
    try:
        return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', px)
    except Exception:
        return ImageFont.load_default()


def oblozhka(src, w, h, out, s_titulom=True):
    im = Image.open(src).convert('RGB')
    W, H = im.size
    r = w / h
    if W / H > r:
        nw = int(H * r)
        im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
    else:
        nh = int(W / r)
        im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
    im = im.resize((w, h), Image.LANCZOS)
    if s_titulom:
        d = ImageDraw.Draw(im)
        f = shrift(int(h * 0.22))
        tw = d.textlength(titul, font=f)
        x, y = (w - tw) / 2, h * 0.06
        for dx, dy in [(-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2), (-2, 2), (2, -2)]:
            d.text((x + dx, y + dy), titul, font=f, fill=(42, 28, 23))
        d.text((x, y), titul, font=f, fill=(255, 179, 71))
    im.save(out)


def geroy():
    # герой в кадре комнаты: ищем по цвету заливки (тёплый оранжевый без обводки значков и угольков)
    g = Image.open(K + 'geroy-1024.png').convert('RGB')
    a = np.array(g).astype(int)
    r, gg, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r > 190) & (r < 248) & (gg > 60) & (gg < 125) & (b < 90)
    ys, xs = np.nonzero(m)
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
    return g, cx, cy


oblozhka(K + '1-5.png', 800, 470, 'portal/oblozhka-800x470.png')
oblozhka(K + '1-5.png', 1280, 720, 'portal/oblozhka-1280x720.png')
g, cx, cy = geroy()
g.crop((cx - 110, cy - 130, cx + 110, cy + 90)).resize((512, 512), Image.LANCZOS).save('portal/ikonka-512.png')
kv = g.crop((cx - 400, cy - 450, cx + 400, cy + 350)).resize((800, 800), Image.LANCZOS)
d = ImageDraw.Draw(kv)
f = shrift(150)
tw = d.textlength(titul, font=f)
for dx, dy in [(-3, 0), (3, 0), (0, -3), (0, 3)]:
    d.text(((800 - tw) / 2 + dx, 60 + dy), titul, font=f, fill=(42, 28, 23))
d.text(((800 - tw) / 2, 60), titul, font=f, fill=(255, 179, 71))
kv.save('portal/oblozhka-800x800.png')
print('обложки и иконка обновлены')
