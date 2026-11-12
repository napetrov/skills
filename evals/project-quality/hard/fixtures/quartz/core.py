def saturated_add(a, b):
    if type(a) is not int or type(b) is not int or not (0 <= a <= 31 and 0 <= b <= 31):
        raise ValueError("operands must be integers from 0 to 31")
    return min(a + b, 31)

def batch(rows):
    out = []
    for start in range(0, len(rows), 64):
        for a, b in rows[start:start + 64]:
            out.append(saturated_add(a, b))
    return out
