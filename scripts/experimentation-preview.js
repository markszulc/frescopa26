const MESSAGE = 'da:contextual-experimentation';

export function getExperimentConfig(namespace, prodHost) {
  return JSON.parse(JSON.stringify({
    experiments: namespace?.experiments || [],
    campaigns: namespace?.campaigns || [],
    audiences: namespace?.audiences || [],
    experimentation: namespace?.experimentation,
    prodHost,
  }));
}

export default function connectAuthorPreview({ prodHost }) {
  const allowedOrigins = new Set([window.location.origin, 'http://localhost:3000']);
  const highlights = new Map();
  const clearHighlight = () => {
    highlights.forEach(({ value, priority }, element) => {
      if (value) element.style.setProperty('outline', value, priority);
      else element.style.removeProperty('outline');
    });
    highlights.clear();
  };

  const onMessage = (event) => {
    if (!allowedOrigins.has(event.origin) || !event.source || event.source === window
      || event.source.parent !== window.parent
      || event.data?.type !== MESSAGE || event.data?.response) return;
    const { requestId, action, selector } = event.data;
    if (typeof requestId !== 'string') return;
    let result;
    try {
      if (action === 'config') {
        result = getExperimentConfig(window.aem || window.hlx, prodHost);
      } else if (action === 'highlight') {
        clearHighlight();
        if (typeof selector !== 'string' || selector.length > 1024) return;
        document.querySelectorAll(selector).forEach((element) => {
          highlights.set(element, {
            value: element.style.getPropertyValue('outline'),
            priority: element.style.getPropertyPriority('outline'),
          });
          element.style.setProperty('outline', '2px solid #3b63fb', 'important');
        });
        result = true;
      } else if (action === 'clear') {
        clearHighlight();
        result = true;
      } else return;
      event.source.postMessage({
        type: MESSAGE, response: true, requestId, result,
      }, event.origin);
    } catch {
      event.source.postMessage({
        type: MESSAGE, response: true, requestId, error: 'Preview action failed.',
      }, event.origin);
    }
  };
  window.addEventListener('message', onMessage);
  return () => {
    window.removeEventListener('message', onMessage);
    clearHighlight();
  };
}
