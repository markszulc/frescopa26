/**
 * Taste Profile block.
 *
 * Authoring model (rows):
 *   Row 1: copy — eyebrow, heading, lede, optional list. Rendered as-is on the left.
 *   Row 2+: each row is a profile with three cells:
 *     - cell 1: profile label (button text, e.g. "After dinner")
 *     - cell 2: readout title (e.g. "The after-dinner cup")
 *     - cell 3: readout description
 * The first profile row (or one whose label contains "active") is shown by default.
 *
 * Renders the copy on the left and, on the right, a readout panel with toggle
 * buttons that swap the active profile.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // First row is the editorial copy.
  const copyRow = rows.shift();
  const copy = document.createElement('div');
  copy.className = 'taste-profile-copy';
  while (copyRow.firstElementChild) copy.append(copyRow.firstElementChild);

  // Remaining rows are profiles.
  const profiles = rows.map((row) => {
    const cells = [...row.children];
    const label = cells[0]?.textContent.trim() || '';
    const title = cells[1]?.textContent.trim() || '';
    const note = cells[2]?.textContent.trim() || '';
    const active = /active/i.test(row.className) || cells[0]?.querySelector('strong');
    return {
      label, title, note, active: !!active,
    };
  });

  const viz = document.createElement('div');
  viz.className = 'taste-profile-viz';

  const readout = document.createElement('div');
  readout.className = 'taste-profile-readout';
  const readoutTitle = document.createElement('h4');
  const readoutNote = document.createElement('p');
  readout.append(readoutTitle, readoutNote);

  const controls = document.createElement('div');
  controls.className = 'taste-profile-controls';

  const setActive = (profile, btn) => {
    readoutTitle.textContent = profile.title;
    readoutNote.textContent = profile.note;
    controls.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  };

  let activeSet = false;
  profiles.forEach((profile, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taste-profile-btn';
    btn.textContent = profile.label;
    btn.addEventListener('click', () => setActive(profile, btn));
    controls.append(btn);
    if ((profile.active || (!activeSet && i === profiles.length - 1)) && !activeSet) {
      setActive(profile, btn);
      activeSet = true;
    }
  });
  if (!activeSet && profiles.length) {
    setActive(profiles[0], controls.querySelector('button'));
  }

  viz.append(readout, controls);

  block.textContent = '';
  block.append(copy, viz);
}
