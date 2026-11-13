def size(layout):
    return sum(width for name, width in layout)

def compatible(old, new):
    return size(old) == size(new)
