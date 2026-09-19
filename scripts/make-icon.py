import struct
import zlib
import sys


def make_png(path, size, maskable=False):
    bg = (47, 128, 201, 255)  # accent blue
    fg = (255, 255, 255, 255)
    pixels = bytearray()
    cx = cy = size / 2
    r_outer = size * (0.5 if maskable else 0.5)
    r_inner = size * (0.30 if maskable else 0.33)
    safe_r = size * (0.4 if maskable else 0.5)
    for y in range(size):
        row = bytearray([0])  # filter type 0
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if maskable and dist > safe_r:
                color = bg
            elif dist <= r_inner:
                color = fg
            elif dist <= r_outer:
                color = bg
            else:
                color = bg
            row.extend(color)
        pixels.extend(row)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(pixels), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    make_png("public/icon-192.png", 192)
    make_png("public/icon-512.png", 512)
    make_png("public/icon-512-maskable.png", 512, maskable=True)
    print("icons written")
