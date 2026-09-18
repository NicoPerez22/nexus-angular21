import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

export interface Organization {
  brand?: string;
  name?: string;
  season?: string | number;
  texts?: Record<string, string>;
  [key: string]: unknown;
}

@Injectable({ providedIn: "root" })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  readonly data = signal<Organization>({
    brand: "HACHA",
    name: "Hacha Esports",
    season: "2026",
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<Organization | { data: Organization }>("/api/organization"),
      );
      const organization =
        typeof response === "object" && response !== null && "data" in response
          ? (response as { data: Organization }).data
          : (response as Organization);
      this.data.set(organization);
    } catch {
      // El layout conserva la marca base si el endpoint aún no está disponible.
    }
  }
}
