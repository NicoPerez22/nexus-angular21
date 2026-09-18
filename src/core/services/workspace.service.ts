import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Workspace, Task, TeamEvent, Team } from "../models/workspace.models";
import { localDate } from "../data/seed";

type ApiCollection<T> = T[] | { data?: T[]; items?: T[]; results?: T[] };
type ApiResult<T> = T | { data?: T };

function collection<T>(response: ApiCollection<T>): T[] {
  return Array.isArray(response)
    ? response
    : response.data || response.items || response.results || [];
}

function result<T>(response: ApiResult<T>): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as { data?: T }).data as T;
  }
  return response as T;
}

@Injectable({ providedIn: "root" })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Workspace>({ teams: [], events: [], tasks: [] });
  readonly error = signal("");
  readonly loading = signal(false);
  readonly teams = computed(() => this.state().teams);
  readonly events = computed(() =>
    [...this.state().events].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time),
    ),
  );
  readonly tasks = computed(() => this.state().tasks);
  readonly pending = computed(() => this.tasks().filter((task) => !task.done));
  readonly players = computed(() =>
    this.teams().reduce((sum, team) => sum + team.players.length, 0),
  );
  readonly winRate = computed(() =>
    Math.round(
      this.teams().reduce((sum, team) => sum + team.win, 0) /
        (this.teams().length || 1),
    ),
  );

  constructor() {
    void this.refresh();
  }

  async refresh(date = localDate()): Promise<void> {
    this.loading.set(true);
    try {
      const [dashboard, stats, teams, events, tasks] = await Promise.all([
        firstValueFrom(this.http.get<unknown>("/api/dashboard", {
          params: new HttpParams().set("date", date),
        })),
        firstValueFrom(this.http.get<unknown>("/api/dashboard/stats")),
        firstValueFrom(this.http.get<ApiCollection<Team>>("/api/teams")),
        firstValueFrom(this.http.get<ApiCollection<TeamEvent>>("/api/calendar/events")),
        firstValueFrom(this.http.get<ApiCollection<Task>>("/api/tasks", {
          params: new HttpParams().set("status", "all"),
        })),
      ]);
      void dashboard;
      void stats;
      this.state.set({
        teams: collection(teams),
        events: collection(events),
        tasks: collection(tasks),
      });
      this.error.set("");
    } catch {
      this.state.set({ teams: [], events: [], tasks: [] });
      this.error.set("No se pudo conectar con el servidor. Verificá que la API esté activa en localhost:3000.");
    } finally {
      this.loading.set(false);
    }
  }

  async loadEvents(team?: string, from?: string, to?: string): Promise<void> {
    let params = new HttpParams();
    if (team && team !== "Todos") params = params.set("team", team);
    if (from) params = params.set("from", from);
    if (to) params = params.set("to", to);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiCollection<TeamEvent>>("/api/calendar/events", { params }),
      );
      this.state.update((state) => ({ ...state, events: collection(response) }));
    } catch {
      this.error.set("No se pudieron cargar los eventos.");
    }
  }

  async loadTasks(status = "all", team?: string): Promise<void> {
    let params = new HttpParams().set("status", status);
    if (team) params = params.set("team", team);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiCollection<Task>>("/api/tasks", { params }),
      );
      this.state.update((state) => ({ ...state, tasks: collection(response) }));
    } catch {
      this.error.set("No se pudieron cargar las tareas.");
    }
  }

  async getTeam(id: string): Promise<Team | null> {
    try {
      return result(await firstValueFrom(this.http.get<Team>(`/api/teams/${id}`)));
    } catch {
      this.error.set("No se pudo cargar el equipo.");
      return null;
    }
  }

  async getTeamPlayers(id: string): Promise<Team["players"]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiCollection<Team["players"][number]>>(`/api/teams/${id}/players`),
      );
      return collection(response);
    } catch {
      this.error.set("No se pudo cargar el roster.");
      return [];
    }
  }

  async getEventAreas(): Promise<string[]> {
    try {
      return collection(await firstValueFrom(
        this.http.get<ApiCollection<string>>("/api/calendar/events/areas"),
      ));
    } catch {
      this.error.set("No se pudieron cargar las áreas del calendario.");
      return [];
    }
  }

  async getTaskAreas(): Promise<string[]> {
    try {
      return collection(await firstValueFrom(
        this.http.get<ApiCollection<string>>("/api/tasks/areas"),
      ));
    } catch {
      this.error.set("No se pudieron cargar las áreas de tareas.");
      return [];
    }
  }

  async saveEvent(event: TeamEvent): Promise<boolean> {
    try {
      const exists = this.state().events.some((item) => item.id === event.id);
      const request = exists
        ? this.http.put<TeamEvent>(`/api/calendar/events/${event.id}`, event)
        : this.http.post<TeamEvent>("/api/calendar/events", event);
      const saved = result(await firstValueFrom(request));
      this.state.update((state) => ({
        ...state,
        events: state.events.some((item) => item.id === saved.id)
          ? state.events.map((item) => item.id === saved.id ? saved : item)
          : [...state.events, saved],
      }));
      return true;
    } catch {
      this.error.set("No se pudo guardar el evento.");
      return false;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`/api/calendar/events/${id}`));
      this.state.update((state) => ({ ...state, events: state.events.filter((event) => event.id !== id) }));
      return true;
    } catch {
      this.error.set("No se pudo eliminar el evento.");
      return false;
    }
  }

  async saveTask(task: Task): Promise<boolean> {
    try {
      const exists = this.state().tasks.some((item) => item.id === task.id);
      const request = exists
        ? this.http.put<Task>(`/api/tasks/${task.id}`, task)
        : this.http.post<Task>("/api/tasks", task);
      const saved = result(await firstValueFrom(request));
      this.state.update((state) => ({
        ...state,
        tasks: state.tasks.some((item) => item.id === saved.id)
          ? state.tasks.map((item) => item.id === saved.id ? saved : item)
          : [...state.tasks, saved],
      }));
      return true;
    } catch {
      this.error.set("No se pudo guardar la tarea.");
      return false;
    }
  }

  async toggleTask(id: string): Promise<boolean> {
    const task = this.tasks().find((item) => item.id === id);
    if (!task) return false;
    try {
      const response = await firstValueFrom(
        this.http.patch<Task>(`/api/tasks/${id}/status`, { done: !task.done }),
      );
      const updated = result(response) || { ...task, done: !task.done };
      this.state.update((state) => ({
        ...state,
        tasks: state.tasks.map((item) => item.id === id ? updated : item),
      }));
      return true;
    } catch {
      this.error.set("No se pudo actualizar el estado de la tarea.");
      return false;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`/api/tasks/${id}`));
      this.state.update((state) => ({ ...state, tasks: state.tasks.filter((task) => task.id !== id) }));
      return true;
    } catch {
      this.error.set("No se pudo eliminar la tarea.");
      return false;
    }
  }

  async saveTeam(team: Team): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.put<Team["players"]>(`/api/teams/${team.id}/players`, team.players),
      );
      const players = result(response);
      this.state.update((state) => ({
        ...state,
        teams: state.teams.map((item) => item.id === team.id ? { ...item, players } : item),
      }));
      return true;
    } catch {
      this.error.set("No se pudo actualizar el roster.");
      return false;
    }
  }

  async createTeam(team: Omit<Team, "id" | "players">): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<Team>("/api/teams", team),
      );
      const created = { ...result(response), players: result(response).players || [] };
      this.state.update((state) => ({ ...state, teams: [...state.teams, created] }));
      return true;
    } catch {
      this.error.set("No se pudo crear el equipo.");
      return false;
    }
  }

  async updateTeam(team: Team): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.put<Team>(`/api/teams/${team.id}`, {
          name: team.name,
          short: team.short,
          sub: team.sub,
          win: team.win,
        }),
      );
      const updated = result(response);
      this.state.update((state) => ({
        ...state,
        teams: state.teams.map((item) => item.id === team.id ? { ...updated, players: updated.players || item.players } : item),
      }));
      return true;
    } catch {
      this.error.set("No se pudo editar el equipo.");
      return false;
    }
  }

  async deleteTeam(id: string): Promise<boolean> {
    try {
      const deletedTeam = this.state().teams.find((team) => team.id === id);
      await firstValueFrom(this.http.delete<void>(`/api/teams/${id}`));
      this.state.update((state) => ({
        ...state,
        teams: state.teams.filter((team) => team.id !== id),
        events: state.events.filter((event) => event.team !== id && event.team !== deletedTeam?.name),
        tasks: state.tasks.filter((task) => task.team !== id && task.team !== deletedTeam?.name),
      }));
      return true;
    } catch {
      this.error.set("No se pudo eliminar el equipo.");
      return false;
    }
  }
}
