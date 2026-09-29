// codegen:layout-pattern=generic-detail
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  profile_summary: 'A two-person weekday household: one prefers silky lattes, the other wants a quick black coffee before a 7am commute.',
  suggested_cups: [
    {
      time_or_moment: '6:45 AM · Weekday',
      person: 'You',
      drink: 'Long black',
      taste_adjustment: 'Full strength, extra hot, no milk',
      reason: 'A fast, hands-off cup ready the moment you reach the kitchen before your 7am commute.',
    },
    {
      time_or_moment: '6:55 AM · Weekday',
      person: 'Your partner',
      drink: 'Latte',
      taste_adjustment: 'Silky microfoam, medium strength, ~60°C milk',
      reason: 'Automatic milk preparation delivers the silky latte they love without hand-steaming.',
    },
    {
      time_or_moment: 'Weekend · Late morning',
      person: 'Both',
      drink: 'Cappuccino & long black',
      taste_adjustment: 'Relaxed timing, no warm-up schedule',
      reason: 'On unhurried mornings the machine skips the pre-alarm warm-up and brews on demand.',
    },
  ],
  matched_capabilities: [
    "Up to 6 household taste profiles ('flavour DNA')",
    'Automatic milk preparation for silky lattes',
    'Automatic warm-up before your alarm',
    'Contextual intelligence reads time of day',
    'Self-reordering beans before you run out',
  ],
  fit_notes: [
    'Needs standard counter space (32 × 24 × 41 cm).',
    "Whisper-quiet 58 dB grinding won't wake a sleeping household.",
    'Learns each person\'s taste over about 7 days, no dialing-in.',
  ],
  assumptions: [
    'Assumed a weekday 7am departure driving the early cup.',
    "Assumed 'silky' means latte-style microfoam at about 60°C.",
    "Assumed 'quick black coffee' means a long black rather than a straight espresso.",
  ],
  recommended_next_step: 'View the Atelier details to confirm the milk system and per-person profiles fit your kitchen.',
};

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!item || (!item.profile_summary && !(item.suggested_cups && item.suggested_cups.length))) {
    const empty = document.createElement('p');
    empty.className = 'par-empty';
    empty.textContent = 'No routine preview is available yet.';
    block.appendChild(empty);
  } else {
    renderPreview(block, item, bridge);
  }

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderPreview(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'par-card';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'par-eyebrow';
  eyebrow.textContent = 'Illustrative Routine Preview';
  card.appendChild(eyebrow);

  if (item.profile_summary) {
    const summary = document.createElement('p');
    summary.className = 'par-summary';
    summary.textContent = item.profile_summary;
    card.appendChild(summary);
  }

  const cups = Array.isArray(item.suggested_cups) ? item.suggested_cups : [];
  if (cups.length) {
    const timeline = document.createElement('div');
    timeline.className = 'par-timeline';

    cups.forEach((cup) => {
      const row = document.createElement('div');
      row.className = 'par-row';

      const rail = document.createElement('div');
      rail.className = 'par-rail';
      const dot = document.createElement('span');
      dot.className = 'par-dot';
      rail.appendChild(dot);
      row.appendChild(rail);

      const cupCard = document.createElement('div');
      cupCard.className = 'par-cup';

      if (cup.time_or_moment) {
        const when = document.createElement('div');
        when.className = 'par-when';
        when.textContent = cup.time_or_moment;
        cupCard.appendChild(when);
      }

      if (cup.person) {
        const who = document.createElement('div');
        who.className = 'par-who';
        who.textContent = cup.person;
        cupCard.appendChild(who);
      }

      if (cup.drink) {
        const drink = document.createElement('h3');
        drink.className = 'par-drink';
        drink.textContent = cup.drink;
        cupCard.appendChild(drink);
      }

      if (cup.taste_adjustment) {
        const taste = document.createElement('div');
        taste.className = 'par-taste';
        taste.textContent = cup.taste_adjustment;
        cupCard.appendChild(taste);
      }

      if (cup.reason) {
        const reason = document.createElement('div');
        reason.className = 'par-reason';
        reason.textContent = cup.reason;
        cupCard.appendChild(reason);
      }

      row.appendChild(cupCard);
      timeline.appendChild(row);
    });

    card.appendChild(timeline);
  }

  const caps = Array.isArray(item.matched_capabilities) ? item.matched_capabilities : [];
  const notes = Array.isArray(item.fit_notes) ? item.fit_notes : [];
  const assumptions = Array.isArray(item.assumptions) ? item.assumptions : [];

  if (caps.length || notes.length || assumptions.length) {
    const panel = document.createElement('div');
    panel.className = 'par-panel';

    if (caps.length) {
      const capLabel = document.createElement('div');
      capLabel.className = 'par-section-label';
      capLabel.textContent = 'Matched capabilities';
      panel.appendChild(capLabel);

      const chips = document.createElement('div');
      chips.className = 'par-chips';
      caps.forEach((cap) => {
        const chip = document.createElement('span');
        chip.className = 'par-chip';
        chip.textContent = cap;
        chips.appendChild(chip);
      });
      panel.appendChild(chips);
    }

    if (notes.length) {
      const noteLabel = document.createElement('div');
      noteLabel.className = 'par-section-label';
      noteLabel.textContent = 'Fit notes';
      panel.appendChild(noteLabel);

      const list = document.createElement('ul');
      list.className = 'par-notes';
      notes.forEach((n) => {
        const li = document.createElement('li');
        li.textContent = n;
        list.appendChild(li);
      });
      panel.appendChild(list);
    }

    if (assumptions.length) {
      const aLabel = document.createElement('div');
      aLabel.className = 'par-assume-label';
      aLabel.textContent = 'Assumptions';
      panel.appendChild(aLabel);

      const aList = document.createElement('ul');
      aList.className = 'par-assumptions';
      assumptions.forEach((a) => {
        const li = document.createElement('li');
        li.textContent = a;
        aList.appendChild(li);
      });
      panel.appendChild(aList);
    }

    card.appendChild(panel);
  }

  const actions = document.createElement('div');
  actions.className = 'par-actions';

  const primary = document.createElement('button');
  primary.className = 'par-cta par-cta-primary';
  primary.type = 'button';
  primary.textContent = 'View Atelier Details';
  if (bridge) {
    primary.addEventListener('click', () => {
      bridge.sendMessage('Show me full details on the Fréscopa Atelier');
    });
  }
  actions.appendChild(primary);

  const compare = document.createElement('button');
  compare.className = 'par-cta par-cta-ghost';
  compare.type = 'button';
  compare.textContent = 'Compare Machines';
  if (bridge) {
    compare.addEventListener('click', () => {
      bridge.sendMessage('Compare the Fréscopa coffee machines for our household');
    });
  }
  actions.appendChild(compare);

  card.appendChild(actions);
  block.appendChild(card);
}
