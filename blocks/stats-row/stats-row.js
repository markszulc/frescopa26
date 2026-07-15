/**
 * Stats row: each row is one statistic.
 * First cell = big number, second cell = label.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cells = [...row.children];
    if (cells[0]) cells[0].className = 'stats-row-number';
    if (cells[1]) cells[1].className = 'stats-row-label';
    while (row.firstElementChild) li.append(row.firstElementChild);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
