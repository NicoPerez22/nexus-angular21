import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkspaceService } from "./workspace.service";
import { AuthService } from "./auth.service";
import { Task, Team, TeamEvent } from "../models/workspace.models";

const teams: Team[] = [{ id: "valorant", name: "Valorant", short: "VAL", sub: "Riot Games", win: 60, players: [] }];
const events: TeamEvent[] = [];
const tasks: Task[] = [{ id: "task-1", name: "Scrim", team: "Valorant", who: "Admin", due: "2026-10-01", priority: false, done: false }];

function flushWorkspace(http: HttpTestingController) {
  http.expectOne((request) => request.url === "/api/dashboard").flush({});
  http.expectOne("/api/dashboard/stats").flush({});
  http.expectOne("/api/teams").flush(teams);
  http.expectOne("/api/calendar/events").flush(events);
  http.expectOne((request) => request.url === "/api/tasks").flush(tasks);
}

describe("Workspace API integration", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it("loads dashboard resources from the API", async () => {
    const store = TestBed.inject(WorkspaceService);
    const http = TestBed.inject(HttpTestingController);
    flushWorkspace(http);
    await Promise.resolve();
    expect(store.teams()).toEqual(teams);
    expect(store.tasks()).toEqual(tasks);
  });

  it("uses POST for a new event and DELETE for removal", async () => {
    const store = TestBed.inject(WorkspaceService);
    const http = TestBed.inject(HttpTestingController);
    flushWorkspace(http);
    await Promise.resolve();
    const event = { id: "new", name: "Final", team: "Valorant", date: "2026-10-01", time: "18:00", type: "Competencia" };
    const save = store.saveEvent(event);
    http.expectOne({ method: "POST", url: "/api/calendar/events" }).flush(event);
    expect(await save).toBe(true);
    const remove = store.deleteEvent("new");
    http.expectOne({ method: "DELETE", url: "/api/calendar/events/new" }).flush(null);
    expect(await remove).toBe(true);
  });

  it("updates task status through the status endpoint", async () => {
    const store = TestBed.inject(WorkspaceService);
    const http = TestBed.inject(HttpTestingController);
    flushWorkspace(http);
    await Promise.resolve();
    const update = store.toggleTask("task-1");
    http.expectOne({ method: "PATCH", url: "/api/tasks/task-1/status" }).flush({ ...tasks[0], done: true });
    expect(await update).toBe(true);
    expect(store.pending()).toHaveLength(0);
  });
});

describe("Authentication API integration", () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it("stores the token returned by login and logs out remotely", async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const login = auth.login("admin@hacha.gg", "secret");
    http.expectOne({ method: "POST", url: "/api/auth/login" }).flush({
      token: "token-1",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user: { email: "admin@hacha.gg" },
    });
    expect(await login).toBe(true);
    expect(sessionStorage.getItem("hacha.auth.token")).toBe("token-1");
    const logout = auth.logout();
    http.expectOne({ method: "POST", url: "/api/auth/logout" }).flush(null);
    await logout;
    expect(auth.user()).toBeNull();
  });
});
