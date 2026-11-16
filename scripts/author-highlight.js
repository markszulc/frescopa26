export default function createAuthorHighlighter() {
  const highlights = new Map();
  const clear = () => {
    highlights.forEach(({ value, priority }, element) => {
      if (value) element.style.setProperty('outline', value, priority);
      else element.style.removeProperty('outline');
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
        });
        element.style.setProperty('outline', '2px solid #3b63fb', 'important');
      });
    },
  };
}
