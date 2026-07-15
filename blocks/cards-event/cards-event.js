/**
 * Event cards: each authored row is one card of default content
 * (day label, title, description, and a "time price" footer line).
 * Decoration builds a semantic <ul>/<li> grid, tags the day label,
 * and splits the final line into a time + price footer.
 * @param {Element} block the cards-event block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cell = row.querySelector(':scope > div') || row;
    const parts = [...cell.children];

    // 1st paragraph = day label
    const day = parts[0];
    if (day && day.tagName === 'P') day.className = 'cards-event-day';

    // last paragraph = "time price" footer line -> split into time + price
    const footerSource = parts[parts.length - 1];
    if (footerSource && footerSource.tagName === 'P' && footerSource !== day) {
      const text = footerSource.textContent.trim();
      // price token is the trailing word (Free, $15, etc.); the rest is the time
      const match = text.match(/^(.*?)\s+(\S+)$/);
      const footer = document.createElement('div');
      footer.className = 'cards-event-footer';
      if (match) {
        const time = document.createElement('span');
        time.className = 'cards-event-time';
        [time.textContent] = [match[1]];
        const price = document.createElement('span');
        price.className = 'cards-event-price';
        [, , price.textContent] = match;
        footer.append(time, price);
      } else {
        footer.textContent = text;
      }
      footerSource.replaceWith(footer);
    }

    // middle content: tag title + description
    cell.querySelectorAll(':scope > h3').forEach((h) => h.classList.add('cards-event-title'));
    cell.querySelectorAll(':scope > p:not(.cards-event-day)').forEach((p) => {
      if (!p.querySelector('.cards-event-footer')) p.classList.add('cards-event-desc');
    });

    while (cell.firstElementChild) li.append(cell.firstElementChild);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
