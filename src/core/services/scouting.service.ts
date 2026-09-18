import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

export interface ScoutTrait { id?: string; name: string; rating: number; }
export interface ScoutObservation { id: string; text?: string; observation?: string; createdAt?: string; author?: string; }
export interface ScoutPlayer { id: string; name: string; role: string; game?: string; status?: string; rating?: number; traitsCount?: number; observationsCount?: number; traits?: ScoutTrait[]; observations?: ScoutObservation[]; }
type ApiCollection<T> = T[] | { data?: T[]; items?: T[]; results?: T[] };
type ApiResult<T> = T | { data?: T };
function collection<T>(response: ApiCollection<T>): T[] { return Array.isArray(response) ? response : response.data || response.items || response.results || []; }
function result<T>(response: ApiResult<T>): T { return typeof response === "object" && response !== null && "data" in response ? (response as { data?: T }).data as T : response as T; }

@Injectable({ providedIn: "root" })
export class ScoutingService {
  private readonly http = inject(HttpClient);
  readonly players = signal<ScoutPlayer[]>([]);
  readonly selected = signal<ScoutPlayer | null>(null);
  readonly error = signal("");
  readonly loading = signal(false);

  constructor() { void this.loadPlayers(); }

  async loadPlayers(game?: string, status?: string): Promise<void> {
    this.loading.set(true);
    let params = new HttpParams();
    if (game) params = params.set("game", game);
    if (status) params = params.set("status", status);
    try { this.players.set(collection(await firstValueFrom(this.http.get<ApiCollection<ScoutPlayer>>("/api/scouting/players", { params })))); this.error.set(""); }
    catch { this.players.set([]); this.error.set("No se pudieron cargar los jugadores de scouting."); }
    finally { this.loading.set(false); }
  }
  async getPlayer(id: string): Promise<ScoutPlayer | null> {
    try { const player = result(await firstValueFrom(this.http.get<ScoutPlayer>(`/api/scouting/players/${id}`))); this.selected.set(player); return player; }
    catch { this.error.set("No se pudo cargar el detalle del jugador."); return null; }
  }
  async createPlayer(payload: Omit<ScoutPlayer, "id" | "traits" | "observations">): Promise<boolean> {
    try { const player = result(await firstValueFrom(this.http.post<ScoutPlayer>("/api/scouting/players", payload))); this.players.update(items => [...items, player]); return true; }
    catch { this.error.set("No se pudo crear la ficha del jugador."); return false; }
  }
  async updatePlayer(player: ScoutPlayer): Promise<boolean> {
    try { const updated = result(await firstValueFrom(this.http.put<ScoutPlayer>(`/api/scouting/players/${player.id}`, player))); this.players.update(items => items.map(item => item.id === player.id ? updated : item)); this.selected.set(updated); return true; }
    catch { this.error.set("No se pudo editar la ficha del jugador."); return false; }
  }
  async deletePlayer(id: string): Promise<boolean> {
    try { await firstValueFrom(this.http.delete<void>(`/api/scouting/players/${id}`)); this.players.update(items => items.filter(item => item.id !== id)); this.selected.set(null); return true; }
    catch { this.error.set("No se pudo eliminar la ficha del jugador."); return false; }
  }
  async replaceTraits(id: string, traits: ScoutTrait[]): Promise<boolean> {
    try { const updated = result(await firstValueFrom(this.http.put<ScoutPlayer>(`/api/scouting/players/${id}/traits`, traits))); this.selected.set(updated); return true; }
    catch { this.error.set("No se pudieron guardar las características."); return false; }
  }
  async addObservation(id: string, observation: string): Promise<boolean> {
    try { const created = result(await firstValueFrom(this.http.post<ScoutObservation>(`/api/scouting/players/${id}/observations`, { observation }))); this.selected.update(player => player ? { ...player, observations: [...(player.observations || []), created] } : player); return true; }
    catch { this.error.set("No se pudo guardar la observación."); return false; }
  }
  async updateObservation(id: string, observation: Partial<ScoutObservation>): Promise<boolean> {
    try { const updated = result(await firstValueFrom(this.http.put<ScoutObservation>(`/api/scouting/observations/${id}`, observation))); this.selected.update(player => player ? { ...player, observations: (player.observations || []).map(item => item.id === id ? updated : item) } : player); return true; }
    catch { this.error.set("No se pudo editar la observación."); return false; }
  }
  async deleteObservation(id: string): Promise<boolean> {
    try { await firstValueFrom(this.http.delete<void>(`/api/scouting/observations/${id}`)); this.selected.update(player => player ? { ...player, observations: (player.observations || []).filter(item => item.id !== id) } : player); return true; }
    catch { this.error.set("No se pudo eliminar la observación."); return false; }
  }
}
