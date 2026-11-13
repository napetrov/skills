# Harbor compatibility analyzer 0.7
Consumers built for an old packed little-endian signed-integer record must read
the same named field values from the new record. Field names are a and b; each
width is 4 or 8 bytes; declaration order may be ab or ba. These eight layouts are
the supported universe for this sample. Values fit the signed 32-bit range.
Linux little-endian packed records only: Windows, native alignment, source ABI
and floating point are explicitly excluded. Do not infer guarantees for them.

The release dashboard reports generated-suite pass percentage. Run
`python -m unittest discover -s tests -v` or `python cli.py`.
The package has no live CI logs or protection-rule export.
