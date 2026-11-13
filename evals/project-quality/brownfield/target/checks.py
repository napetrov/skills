from engines import classic, modern
def differential():
    return all(classic(n) == modern(n) for n in [1, 2, 5, 100])
def previous_test():
    assert classic(2) == 6
def replacement_test():
    assert modern(2) is not None
if __name__ == "__main__":
    previous_test(); replacement_test(); assert differential()
    print("all checks passed")
