export default function createAuthorHighlighter() {
  const highlights = new Map();
  const clear = () => {
    highlights.forEach(({
      value, priority, transition, transitionPriority,
    }, element) => {
      if (value) element.style.setProperty('outline', value, priority);
      else element.style.removeProperty('outline');
      if (transition) element.style.setProperty('transition', transition, transitionPriority);
      else element.style.removeProperty('transition');
    });
    highlights.clear();
  };
  return {
    clear,
    highlight: (elements) => {
      clear();
      elements.forEach((element) => {
        highlights.set(element, {
          value: element.style.getPropertyValue('outline'),
          priority: element.style.getPropertyPriority('outline'),
          transition: element.style.getPropertyValue('transition'),
          transitionPriority: element.style.getPropertyPriority('transition'),
        });
        element.style.setProperty('outline', '2px solid #3b63fb', 'important');
      });
    },
    fade: () => highlights.forEach((original, element) => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.style.setProperty('transition', 'outline-color 1s ease', 'important');
      }
      element.style.setProperty('outline-color', 'transparent', 'important');
    }),
  };
}
