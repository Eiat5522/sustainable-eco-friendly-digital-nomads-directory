/**
 * Utility functions for tag styling and coloring
 */

/**
 * Returns appropriate Tailwind CSS classes for a tag based on its text content and category
 * @param text - The tag text to analyze
 * @param category - The category of the tag ('eco' for sustainability features or 'amenity' for facilities)
 * @returns Tailwind CSS class string for background and text colors
 */
export function getTagColorClasses(text: string, category: 'eco' | 'amenity'): string {
  const t = text.toLowerCase();
  
  if (category === 'eco') {
    if (/solar|renewable|energy/.test(t)) return 'bg-emerald-100 text-emerald-700';
    if (/waste|zero|recycl/.test(t)) return 'bg-lime-100 text-lime-700';
    if (/water|conserv/.test(t)) return 'bg-cyan-100 text-cyan-700';
    if (/vegan|vegetarian|organic/.test(t)) return 'bg-teal-100 text-teal-700';
    if (/garden|bike|walk|green/.test(t)) return 'bg-green-100 text-green-700';
    return 'bg-emerald-100 text-emerald-700';
  }
  
  // amenity category
  if (/wifi|internet/.test(t)) return 'bg-blue-100 text-blue-700';
  if (/meeting|conference|room|call/.test(t)) return 'bg-indigo-100 text-indigo-700';
  if (/24\/?7|24-7|24x7|access/.test(t)) return 'bg-purple-100 text-purple-700';
  if (/kitchen|restaurant|bar|cafe/.test(t)) return 'bg-amber-100 text-amber-800';
  if (/security|locker|safe/.test(t)) return 'bg-orange-100 text-orange-700';
  if (/bike|parking/.test(t)) return 'bg-sky-100 text-sky-700';
  if (/garden|terrace|rooftop/.test(t)) return 'bg-green-100 text-green-700';
  return 'bg-blue-100 text-blue-700';
}
