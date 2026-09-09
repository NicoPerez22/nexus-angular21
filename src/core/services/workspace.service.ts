import { Injectable, computed, signal } from "@angular/core";
import { Workspace, Task, TeamEvent, Team } from "../models/workspace.models";
import { createSeed } from "../data/seed";
@Injectable({ providedIn: "root" })
export class WorkspaceService {
  private readonly key = "nexus.workspace.v1";
  readonly error = signal("");
  private readonly state = signal<Workspace>(this.load());
  readonly teams = computed(() => this.state().teams);
  readonly events = computed(() =>
    [...this.state().events].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time),
    ),
  );
  readonly tasks = computed(() => this.state().tasks);
  readonly pending = computed(() => this.tasks().filter((t) => !t.done));
  readonly players = computed(() =>
    this.teams().reduce((sum, t) => sum + t.players.length, 0),
  );
  readonly winRate = computed(() =>
    Math.round(
      this.teams().reduce((sum, t) => sum + t.win, 0) /
        (this.teams().length || 1),
    ),
  );
  private load(): Workspace {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const data = JSON.parse(raw) as Workspace;
        if (
          Array.isArray(data.teams) &&
          Array.isArray(data.events) &&
          Array.isArray(data.tasks) &&
          data.teams.every(
            (t) => Array.isArray(t.players) && typeof t.win === "number",
          ) &&
          data.events.every(
            (e) => typeof e.date === "string" && typeof e.time === "string",
          )
        )
          return data;
      }
    } catch {
      this.error.set(
        "No se pudieron leer los datos guardados. Se cargó el espacio de ejemplo.",
      );
    }
    return createSeed();
  }
  private commit(data: Workspace): boolean {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      this.state.set(data);
      this.error.set("");
      return true;
    } catch {
      this.error.set(
        "No se pudo guardar. Revisá el espacio o los permisos del navegador e intentá nuevamente.",
      );
      return false;
    }
  }
  saveEvent(event: TeamEvent) {
    return this.commit({
      ...this.state(),
      events: this.events().some((e) => e.id === event.id)
        ? this.events().map((e) => (e.id === event.id ? event : e))
        : [...this.events(), event],
    });
  }
  deleteEvent(id: string) {
    return this.commit({
      ...this.state(),
      events: this.events().filter((e) => e.id !== id),
    });
  }
  saveTask(task: Task) {
    return this.commit({
      ...this.state(),
      tasks: this.tasks().some((t) => t.id === task.id)
        ? this.tasks().map((t) => (t.id === task.id ? task : t))
        : [...this.tasks(), task],
    });
  }
  toggleTask(id: string) {
    const task = this.tasks().find((t) => t.id === id);
    if (task) this.saveTask({ ...task, done: !task.done });
  }
  deleteTask(id: string) {
    return this.commit({
      ...this.state(),
      tasks: this.tasks().filter((t) => t.id !== id),
    });
  }
  saveTeam(team: Team) {
    return this.commit({
      ...this.state(),
      teams: this.teams().map((t) => (t.id === team.id ? team : t)),
    });
  }
}
