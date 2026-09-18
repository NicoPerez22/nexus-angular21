import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

export type FinanceKind = "ingreso" | "egreso" | "ambos";
export interface FinanceCategory { id: string; name: string; kind: FinanceKind; }
export interface FinanceMovement { id: string; kind: "ingreso" | "egreso"; categoryId: string; category?: FinanceCategory | string; amount: number; date: string; concept: string; detail?: string; }
export interface FinanceSummary { income: number; expenses: number; balance: number; ingresos?: number; egresos?: number; }
export interface MonthlyChart { month: string; income?: number; expenses?: number; ingresos?: number; egresos?: number; }
export interface CategoryChart { category: string; name?: string; amount: number; total?: number; }

type ApiCollection<T> = T[] | { data?: T[]; items?: T[]; results?: T[] };
type ApiResult<T> = T | { data?: T };
function collection<T>(response: ApiCollection<T>): T[] { return Array.isArray(response) ? response : response.data || response.items || response.results || []; }
function result<T>(response: ApiResult<T>): T { return typeof response === "object" && response !== null && "data" in response ? (response as { data?: T }).data as T : response as T; }
function normalizeSummary(summary: FinanceSummary): FinanceSummary { return { ...summary, income: summary.income ?? summary.ingresos ?? 0, expenses: summary.expenses ?? summary.egresos ?? 0, balance: summary.balance ?? ((summary.ingresos ?? summary.income ?? 0) - (summary.egresos ?? summary.expenses ?? 0)) }; }

@Injectable({ providedIn: "root" })
export class FinanceService {
  private readonly http = inject(HttpClient);
  readonly categories = signal<FinanceCategory[]>([]);
  readonly movements = signal<FinanceMovement[]>([]);
  readonly summary = signal<FinanceSummary>({ income: 0, expenses: 0, balance: 0 });
  readonly monthly = signal<MonthlyChart[]>([]);
  readonly categoryChart = signal<CategoryChart[]>([]);
  readonly error = signal("");
  readonly loading = signal(false);

  constructor() { void this.load(); }

  async load(year = new Date().getFullYear()): Promise<void> {
    this.loading.set(true);
    try {
      const [categories, movements, summary, monthly, categoryChart] = await Promise.all([
        firstValueFrom(this.http.get<ApiCollection<FinanceCategory>>("/api/finance/categories")),
        firstValueFrom(this.http.get<ApiCollection<FinanceMovement>>("/api/finance/movements")),
        firstValueFrom(this.http.get<ApiResult<FinanceSummary>>("/api/finance/summary")),
        firstValueFrom(this.http.get<ApiCollection<MonthlyChart>>("/api/finance/charts/monthly", { params: new HttpParams().set("year", year) })),
        firstValueFrom(this.http.get<ApiCollection<CategoryChart>>("/api/finance/charts/categories", { params: new HttpParams().set("kind", "egreso") })),
      ]);
      this.categories.set(collection(categories));
      this.movements.set(collection(movements));
      this.summary.set(normalizeSummary(result(summary)));
      this.monthly.set(collection(monthly));
      this.categoryChart.set(collection(categoryChart));
      this.error.set("");
    } catch {
      this.error.set("No se pudieron cargar las finanzas. Verificá la conexión con la API.");
      this.clear();
    } finally { this.loading.set(false); }
  }

  async createCategory(payload: Omit<FinanceCategory, "id">): Promise<boolean> {
    try { const created = result(await firstValueFrom(this.http.post<FinanceCategory>("/api/finance/categories", payload))); this.categories.update(items => [...items, created]); return true; }
    catch { this.error.set("No se pudo crear la categoría."); return false; }
  }
  async updateCategory(category: FinanceCategory): Promise<boolean> {
    try { const updated = result(await firstValueFrom(this.http.put<FinanceCategory>(`/api/finance/categories/${category.id}`, { name: category.name, kind: category.kind }))); this.categories.update(items => items.map(item => item.id === category.id ? updated : item)); return true; }
    catch { this.error.set("No se pudo editar la categoría."); return false; }
  }
  async deleteCategory(id: string): Promise<boolean> {
    try { await firstValueFrom(this.http.delete<void>(`/api/finance/categories/${id}`)); this.categories.update(items => items.filter(item => item.id !== id)); return true; }
    catch { this.error.set("No se pudo borrar la categoría. Puede tener movimientos asociados."); return false; }
  }
  async createMovement(payload: Omit<FinanceMovement, "id">): Promise<boolean> {
    try { const created = result(await firstValueFrom(this.http.post<FinanceMovement>("/api/finance/movements", payload))); this.movements.update(items => [created, ...items]); await this.loadCharts(); return true; }
    catch { this.error.set("No se pudo registrar el movimiento."); return false; }
  }
  async updateMovement(movement: FinanceMovement): Promise<boolean> {
    try { const updated = result(await firstValueFrom(this.http.put<FinanceMovement>(`/api/finance/movements/${movement.id}`, movement))); this.movements.update(items => items.map(item => item.id === movement.id ? updated : item)); await this.loadCharts(); return true; }
    catch { this.error.set("No se pudo editar el movimiento."); return false; }
  }
  async deleteMovement(id: string): Promise<boolean> {
    try { await firstValueFrom(this.http.delete<void>(`/api/finance/movements/${id}`)); this.movements.update(items => items.filter(item => item.id !== id)); await this.loadCharts(); return true; }
    catch { this.error.set("No se pudo eliminar el movimiento."); return false; }
  }
  async loadCharts(year = new Date().getFullYear()): Promise<void> {
    try {
      const [summary, monthly, categoryChart] = await Promise.all([
        firstValueFrom(this.http.get<ApiResult<FinanceSummary>>("/api/finance/summary")),
        firstValueFrom(this.http.get<ApiCollection<MonthlyChart>>("/api/finance/charts/monthly", { params: new HttpParams().set("year", year) })),
        firstValueFrom(this.http.get<ApiCollection<CategoryChart>>("/api/finance/charts/categories", { params: new HttpParams().set("kind", "egreso") })),
      ]);
      this.summary.set(normalizeSummary(result(summary))); this.monthly.set(collection(monthly)); this.categoryChart.set(collection(categoryChart));
    } catch { this.error.set("No se pudieron actualizar los gráficos financieros."); }
  }
  clear() { this.categories.set([]); this.movements.set([]); this.summary.set({ income: 0, expenses: 0, balance: 0 }); this.monthly.set([]); this.categoryChart.set([]); }
}
