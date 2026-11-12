import struct

def fmt(layout):
    return "<" + "".join({4:"i", 8:"q"}[width] for name, width in layout)

def encode(layout, values):
    return struct.pack(fmt(layout), *(values[name] for name, width in layout))

def decode(layout, data):
    return dict(zip((name for name, width in layout), struct.unpack(fmt(layout), data)))
