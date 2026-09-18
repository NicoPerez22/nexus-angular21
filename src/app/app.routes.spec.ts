import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { routes } from "./app.routes";
import { AuthService } from "../core/services/auth.service";
describe("Protected page navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });
  it("redirects anonymous navigation to login", async () => {
    await RouterTestingHarness.create("/equipos");
    expect(TestBed.inject(Router).url).toContain("/login");
  });
  it("renders every feature after login", async () => {
    const login = TestBed.inject(AuthService).login("admin@hacha.gg", "Hacha2026!");
    const http = TestBed.inject(HttpTestingController);
    http.expectOne("/api/auth/login").flush({ token: "test-token", user: { email: "admin@hacha.gg" } });
    await login;
    const h = await RouterTestingHarness.create();
    for (const url of ["/resumen", "/equipos", "/calendario", "/tareas"]) {
      await h.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe(url);
      expect(h.routeNativeElement?.querySelector("h1")).toBeTruthy();
    }
  });
});
