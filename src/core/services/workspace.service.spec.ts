import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkspaceService } from "./workspace.service";
import { AuthService } from "./auth.service";

describe("Workspace persistence and mutations", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });
  it("persists event creation, edition and deletion across service reloads", () => {
    const store = TestBed.inject(WorkspaceService);
    const event = {
      id: "new",
      name: "Scrim",
      team: "Valorant",
      date: "2026-10-01",
      time: "18:00",
      type: "Entrenamiento",
    };
    expect(store.saveEvent(event)).toBe(true);
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(WorkspaceService);
    expect(reloaded.events().find((e) => e.id === "new")?.name).toBe("Scrim");
    reloaded.saveEvent({ ...event, name: "Final" });
    expect(reloaded.events().filter((e) => e.id === "new")).toHaveLength(1);
    expect(reloaded.events().find((e) => e.id === "new")?.name).toBe("Final");
    reloaded.deleteEvent("new");
    expect(reloaded.events().some((e) => e.id === "new")).toBe(false);
  });
  it("updates pending totals and player totals from saved data", () => {
    const store = TestBed.inject(WorkspaceService);
    const count = store.pending().length;
    store.toggleTask(store.tasks()[0].id);
    expect(store.pending().length).toBe(count - 1);
    const players = store.players();
    const team = store.teams()[0];
    store.saveTeam({
      ...team,
      players: [...team.players, { name: "rookie", role: "Flex" }],
    });
    expect(store.players()).toBe(players + 1);
  });
  it("preserves existing data when storage fails", () => {
    const store = TestBed.inject(WorkspaceService);
    const task = store.tasks()[0];
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota");
      });
    expect(store.deleteTask(task.id)).toBe(false);
    expect(store.tasks().some((t) => t.id === task.id)).toBe(true);
    expect(store.error()).not.toBe("");
    spy.mockRestore();
  });
  it("recovers safely from corrupt stored JSON", () => {
    localStorage.setItem("nexus.workspace.v1", "{bad");
    const store = TestBed.inject(WorkspaceService);
    expect(store.teams().length).toBe(3);
    expect(store.error()).not.toBe("");
  });
});
describe("Demo authentication", () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });
  it("rejects invalid credentials and restores a valid session until logout", () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.login("admin@nexus.gg", "wrong")).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.login("admin@nexus.gg", "Nexus2026!")).toBe(true);
    TestBed.resetTestingModule();
    const restored = TestBed.inject(AuthService);
    expect(restored.user()).toBe("admin@nexus.gg");
    restored.logout();
    expect(restored.user()).toBeNull();
    expect(sessionStorage.getItem("nexus.demo.session")).toBeNull();
  });
});
