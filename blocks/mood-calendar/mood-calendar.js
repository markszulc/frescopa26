/**
 * Mood Calendar block.
 *
 * Authoring model (rows):
 *   Row 1: copy — eyebrow, heading, lede, hint. Rendered as-is on the left.
 *   Row 2+: each row is a selectable day with four cells:
 *     - cell 1: day number/label (e.g. "7")
 *     - cell 2: brew tag (e.g. "Gentle")
 *     - cell 3: brew title (e.g. "The lingering cup")
 *     - cell 4: brew note
 *   Optional first row before the days can carry a month + year label using two
 *   cells (e.g. "March" | "2026"); if present it is rendered in the calendar head.
 * The first day (or one whose row class contains "active") is selected by default.
 *
 * Renders the copy on the left and, on the right, a calendar card. The calendar
 * shows a month header, weekday labels, and a grid of day cells. Authored days
 * render as selectable buttons; intervening day numbers render as muted,
 * non-selectable cells so the grid reads as a real week. Selecting a day updates
 * the brew readout panel below the grid.
 */

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const copyRow = rows.shift();
  const copy = document.createElement('div');
  copy.className = 'mood-calendar-copy';
  while (copyRow.firstElementChild) copy.append(copyRow.firstElementChild);

  // Optional month/year header row: a row with exactly two cells and no numeric
  // day in the first cell that isn't followed by brew content.
  let month = 'March';
  let year = '2026';
  if (rows.length) {
    const first = rows[0];
    const cells = [...first.children];
    const looksLikeHeader = cells.length === 2
      && Number.isNaN(Number(cells[0]?.textContent.trim()))
      && !!cells[1]?.textContent.trim()
      && Number.isNaN(Number(cells[1]?.textContent.trim())) === false;
    if (looksLikeHeader) {
      month = cells[0].textContent.trim();
      year = cells[1].textContent.trim();
      rows.shift();
    }
  }

  const days = rows.map((row) => {
    const cells = [...row.children];
    return {
      day: cells[0]?.textContent.trim() || '',
      tag: cells[1]?.textContent.trim() || '',
      title: cells[2]?.textContent.trim() || '',
      note: cells[3]?.textContent.trim() || '',
      active: /active/i.test(row.className) || !!cells[0]?.querySelector('strong'),
    };
  });

  const panel = document.createElement('div');
  panel.className = 'mood-calendar-panel';

  const card = document.createElement('div');
  card.className = 'mood-calendar-cal';

  const head = document.createElement('div');
  head.className = 'mood-calendar-head';
  const monthEl = document.createElement('span');
  monthEl.className = 'mood-calendar-month';
  monthEl.textContent = month;
  const yearEl = document.createElement('span');
  yearEl.className = 'mood-calendar-year';
  yearEl.textContent = year;
  head.append(monthEl, yearEl);

  const grid = document.createElement('div');
  grid.className = 'mood-calendar-grid';
  DOW.forEach((d) => {
    const dow = document.createElement('span');
    dow.className = 'mood-calendar-dow';
    dow.textContent = d;
    grid.append(dow);
  });

  const brew = document.createElement('div');
  brew.className = 'mood-calendar-brew';
  const brewTag = document.createElement('span');
  brewTag.className = 'mood-calendar-tag';
  const brewTitle = document.createElement('h4');
  brewTitle.className = 'mood-calendar-title';
  const brewNote = document.createElement('p');
  brewNote.className = 'mood-calendar-note';
  brew.append(brewTag, brewTitle, brewNote);

  const setActive = (info, btn) => {
    brewTag.textContent = info.tag;
    brewTitle.textContent = info.title;
    brewNote.textContent = info.note;
    grid.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  };

  // Build a contiguous run of day numbers so authored days sit in a real week,
  // filling the gaps with muted (non-selectable) cells.
  const numbers = days.map((d) => Number(d.day)).filter((n) => !Number.isNaN(n));
  const byNumber = new Map(days.map((d) => [Number(d.day), d]));
  const min = numbers.length ? Math.min(...numbers) : null;
  const max = numbers.length ? Math.max(...numbers) : null;

  const buttons = new Map();
  if (min !== null) {
    for (let n = min; n <= max; n += 1) {
      const info = byNumber.get(n);
      if (info) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mood-calendar-day';
        btn.textContent = info.day;
        btn.addEventListener('click', () => setActive(info, btn));
        grid.append(btn);
        buttons.set(n, { info, btn });
      } else {
        const muted = document.createElement('span');
        muted.className = 'mood-calendar-day mood-calendar-muted';
        muted.textContent = String(n);
        grid.append(muted);
      }
    }
  } else {
    // Fallback: render each authored day as a button in order.
    days.forEach((info) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mood-calendar-day';
      btn.textContent = info.day;
      btn.addEventListener('click', () => setActive(info, btn));
      grid.append(btn);
      buttons.set(info.day, { info, btn });
    });
  }

  // Select the default day.
  let activeKey = null;
  days.forEach((info) => {
    if (info.active && activeKey === null) activeKey = Number(info.day);
  });
  if (activeKey === null && days.length) activeKey = Number(days[0].day);
  const chosen = buttons.get(activeKey) || [...buttons.values()][0];
  if (chosen) setActive(chosen.info, chosen.btn);

  card.append(head, grid);
  panel.append(card, brew);

  block.textContent = '';
  block.append(copy, panel);
}
