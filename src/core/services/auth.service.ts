import { Injectable, signal } from "@angular/core";
@Injectable({ providedIn: "root" })
export class AuthService {
  readonly user = signal<string | null>(this.restore());
  private restore(): string | null {
    try {
      return sessionStorage.getItem("nexus.demo.session") === "admin@nexus.gg"
        ? "admin@nexus.gg"
        : null;
    } catch {
      return null;
    }
  }
  // Demo frontend only. Replace with an API and server-validated sessions for production.
  login(email: string, password: string): boolean {
    if (
      email.trim().toLowerCase() !== "admin@nexus.gg" ||
      password !== "Nexus2026!"
    )
      return false;
    try {
      sessionStorage.setItem("nexus.demo.session", "admin@nexus.gg");
      this.user.set("admin@nexus.gg");
      return true;
    } catch {
      return false;
    }
  }
  logout() {
    try {
      sessionStorage.removeItem("nexus.demo.session");
    } finally {
      this.user.set(null);
    }
  }
}
