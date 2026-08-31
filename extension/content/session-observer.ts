export interface SessionObserver { disconnect(): void; }

export function observeScannedElements(
  elements: Iterable<HTMLElement>,
  onInvalidated: () => void
): SessionObserver {
  const tracked = new Set(elements);
  const observer = new MutationObserver(mutations => {
    const removedTrackedElement = mutations.some(mutation => Array.from(mutation.removedNodes).some(node =>
      node instanceof Element && Array.from(tracked).some(element => node === element || node.contains(element))
    ));
    if (removedTrackedElement || Array.from(tracked).some(element => !element.isConnected)) {
      observer.disconnect();
      onInvalidated();
    }
  });
  const document = Array.from(tracked)[0]?.ownerDocument ?? globalThis.document;
  if (document?.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
  return { disconnect: () => observer.disconnect() };
}