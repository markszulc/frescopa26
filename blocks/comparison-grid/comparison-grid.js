/**
 * Comparison Grid Block
 *
 * General-purpose side-by-side comparison of 2-3 items with structured attributes.
 * Positional authoring model:
 *   - Default: first row = column headers (item names), remaining rows = attribute rows
 *     (cell 0 = attribute label, cells 1-N = values per item)
 *   - Variant 'simple': no header row, just attribute rows (for spec-sheet style)
 *
 * Cell 0 (attribute labels) are kept static by the da-blocks-slots engine.
 * Image cells and whole-cell links are auto-detected as fillable slots.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const isSimple = block.classList.contains('simple');
  let headerRow = null;

  // Extract header row unless 'simple' variant
  if (!isSimple && rows.length > 1) {
    headerRow = rows.shift();
  }

  const grid = document.createElement('div');
  grid.className = 'comparison-grid-table';

  // Build header
  if (headerRow) {
    const header = document.createElement('div');
    header.className = 'comparison-grid-header';
    const cells = [...headerRow.children];

    cells.forEach((cell, idx) => {
      const col = document.createElement('div');
      col.className = idx === 0 ? 'comparison-grid-header-label' : 'comparison-grid-header-item';
      while (cell.firstElementChild) col.append(cell.firstElementChild);
      header.append(col);
    });

    grid.append(header);
  }

  // Build attribute rows
  rows.forEach((row) => {
    const cells = [...row.children];
    const gridRow = document.createElement('div');
    gridRow.className = 'comparison-grid-row';

    cells.forEach((cell, idx) => {
      const col = document.createElement('div');
      col.className = idx === 0 ? 'comparison-grid-label' : 'comparison-grid-value';

      // Move content
      while (cell.firstElementChild) col.append(cell.firstElementChild);

      gridRow.append(col);
    });

    grid.append(gridRow);
  });

  block.textContent = '';
  block.append(grid);
}
