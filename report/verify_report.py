import docx

doc = docx.Document('report/CivicFlow_Case_Study_Report.docx')

print("=== CHECKING FOR REMAINING PLACEHOLDERS ===")
found_placeholders = []
for i, p in enumerate(doc.paragraphs):
    if '[INSERT' in p.text:
        found_placeholders.append(f"P[{i}]: {p.text}")

for t_idx, t in enumerate(doc.tables):
    for r_idx, row in enumerate(t.rows):
        for c_idx, cell in enumerate(row.cells):
            if '[INSERT' in cell.text:
                found_placeholders.append(f"T[{t_idx}] R[{r_idx}] C[{c_idx}]: {cell.text.strip()}")

print(f"Total remaining placeholders: {len(found_placeholders)}")
for f in found_placeholders:
    print(" ", f)

print("\n=== VERIFYING SECTION 2 ===")
print("P[103]:", doc.paragraphs[103].text)
t2 = doc.tables[2]
print("Table 2.1 Row 7:", [c.text.strip() for c in t2.rows[7].cells])
print("Table 2.1 Row 8:", [c.text.strip() for c in t2.rows[8].cells])
print("Table 2.1 Row 13:", [c.text.strip() for c in t2.rows[13].cells])

print("\n=== VERIFYING TABLES 14-17 ===")
for t_idx in [14, 15, 16, 17]:
    cell = doc.tables[t_idx].rows[0].cells[0]
    drawings = cell._element.xpath('.//a:blip/@r:embed')
    print(f"Table {t_idx}: paragraphs={len(cell.paragraphs)}, drawings={drawings}")
    print(f"  First paragraph: {cell.paragraphs[0].text[:80]}")
    print(f"  Last paragraph:  {cell.paragraphs[-1].text[:80]}")
