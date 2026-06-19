/**
 * OOXML XML helpers - namespace-aware element queries.
 *
 * OOXML documents declare elements like <w:body>, <w:p>, <x:row> etc., and
 * browsers treat the full tag name inconsistently (some use "w:body", others
 * just "body"). These helpers let callers query by the local (unprefixed) name.
 */

function hasPrefix(nodeName: string): boolean {
  return nodeName.includes(':');
}

function stripPrefix(nodeName: string): string {
  const idx = nodeName.indexOf(':');
  return idx >= 0 ? nodeName.substring(idx + 1) : nodeName;
}

/**
 * Find the first descendant (including itself) whose local name matches any of
 * the provided names. Comparison is case-insensitive.
 */
export function getFirstByLocalName(root: Element | Document | null, ...names: string[]): Element | null {
  if (!root) return null;
  const lowered = names.map(n => n.toLowerCase());
  const candidates: Element[] = [];

  // Prefer getElementsByTagName('*') because it's fast and covers all descendants
  const all = (root as Element).getElementsByTagName
    ? (root as Element).getElementsByTagName('*')
    : (root as Document).getElementsByTagName('*');

  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const tag = el.tagName;
    const local = hasPrefix(tag) ? stripPrefix(tag).toLowerCase() : tag.toLowerCase();
    if (lowered.includes(local)) {
      candidates.push(el);
    }
  }

  if (candidates.length > 0) return candidates[0];
  return null;
}

/**
 * Find all descendants whose local name matches one of the provided names.
 */
export function getAllByLocalName(root: Element | Document | null, ...names: string[]): Element[] {
  if (!root) return [];
  const lowered = names.map(n => n.toLowerCase());
  const result: Element[] = [];

  const all = (root as Element).getElementsByTagName
    ? (root as Element).getElementsByTagName('*')
    : (root as Document).getElementsByTagName('*');

  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const tag = el.tagName;
    const local = hasPrefix(tag) ? stripPrefix(tag).toLowerCase() : tag.toLowerCase();
    if (lowered.includes(local)) {
      result.push(el);
    }
  }
  return result;
}

/**
 * Get direct children of an element whose local name matches any of `names`.
 */
export function getChildrenByLocalName(root: Element | null, ...names: string[]): Element[] {
  if (!root) return [];
  const lowered = names.map(n => n.toLowerCase());
  const result: Element[] = [];
  const children = root.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const tag = el.tagName;
    const local = hasPrefix(tag) ? stripPrefix(tag).toLowerCase() : tag.toLowerCase();
    if (lowered.includes(local)) {
      result.push(el);
    }
  }
  return result;
}

/**
 * Get the local (unprefixed) name of an element.
 */
export function getLocalName(el: Element | null | undefined): string {
  if (!el) return '';
  const tag = el.tagName;
  return hasPrefix(tag) ? stripPrefix(tag).toLowerCase() : tag.toLowerCase();
}

/**
 * Check if an element's local name matches one of the given names.
 */
export function isLocalName(el: Element | null | undefined, ...names: string[]): boolean {
  if (!el) return false;
  const local = getLocalName(el);
  return names.map(n => n.toLowerCase()).includes(local);
}

/**
 * Extract plain text from element, recursively. Preserves <br> as line breaks.
 */
export function getTextContent(root: Element | null | undefined): string {
  if (!root) return '';
  let out = '';
  const walker = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.nodeValue || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const local = getLocalName(el);
    if (local === 'br' || local === 'tab') {
      out += '\n';
      return;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      walker(node.childNodes[i]);
    }
  };
  for (let i = 0; i < root.childNodes.length; i++) {
    walker(root.childNodes[i]);
  }
  return out;
}
