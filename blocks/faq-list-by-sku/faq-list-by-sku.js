export default function decorate(block) {
  if (!block.textContent.trim()) {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'Product FAQs will appear here.';
    block.append(placeholder);
  }
}
