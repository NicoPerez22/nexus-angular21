import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

interface ApiUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  token?: string;
  accessToken?: string;
  expiresAt?: string;
  expiresIn?: number;
  user?: ApiUser;
  data?: LoginResponse;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<ApiUser | null>(this.restore());
  readonly loading = signal(false);

  private restore(): ApiUser | null {
    try {
      const token = sessionStorage.getItem("hacha.auth.token");
      const expiresAt = sessionStorage.getItem("hacha.auth.expiresAt");
      const storedUser = sessionStorage.getItem("hacha.auth.user");
      if (!token || (expiresAt && Date.parse(expiresAt) <= Date.now())) return null;
      return storedUser ? (JSON.parse(storedUser) as ApiUser) : null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>("/api/auth/login", { email, password }),
      );
      const payload = response.data || response;
      const token = payload.token || payload.accessToken;
      if (!token) return false;
      const expiresAt = payload.expiresAt ||
        (payload.expiresIn ? new Date(Date.now() + payload.expiresIn * 1000).toISOString() : "");
      const user = payload.user || { email };
      sessionStorage.setItem("hacha.auth.token", token);
      sessionStorage.setItem("hacha.auth.expiresAt", expiresAt);
      sessionStorage.setItem("hacha.auth.user", JSON.stringify(user));
      this.user.set(user);
      return true;
    } catch {
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async restoreSession(): Promise<void> {
    if (!sessionStorage.getItem("hacha.auth.token")) return;
    try {
      const response = await firstValueFrom(this.http.get<ApiUser | { data: ApiUser }>("/api/auth/me"));
      const user = ("data" in response ? response.data : response) as ApiUser;
      sessionStorage.setItem("hacha.auth.user", JSON.stringify(user));
      this.user.set(user);
    } catch {
      this.clearSession();
    }
  }

  async logout(): Promise<void> {
    try {
      if (sessionStorage.getItem("hacha.auth.token")) {
        await firstValueFrom(this.http.post<void>("/api/auth/logout", {}));
      }
    } finally {
      this.clearSession();
    }
  }

  async createUser(payload: {
    email: string;
    name: string;
    password: string;
    role: "admin" | "coach" | "viewer";
  }): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post("/api/auth/users", payload));
      return true;
    } catch {
      return false;
    }
  }

  private clearSession() {
    sessionStorage.removeItem("hacha.auth.token");
    sessionStorage.removeItem("hacha.auth.expiresAt");
    sessionStorage.removeItem("hacha.auth.user");
    this.user.set(null);
  }
}
