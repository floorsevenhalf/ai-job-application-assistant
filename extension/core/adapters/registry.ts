import type { SiteAdapter } from "./types";

export class SiteAdapterRegistry {
  private readonly adapters = new Map<string, SiteAdapter>();

  register(adapter: SiteAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error(`Duplicate site adapter: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }
  unregister(id: string): boolean { return this.adapters.delete(id); }
  matching(url: URL): SiteAdapter[] { return [...this.adapters.values()].filter(adapter => adapter.matches(url)); }
  list(): SiteAdapter[] { return [...this.adapters.values()]; }
}

export const siteAdapterRegistry = new SiteAdapterRegistry();