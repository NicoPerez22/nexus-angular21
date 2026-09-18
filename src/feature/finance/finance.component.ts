import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { FinanceCategory, FinanceKind, FinanceMovement, FinanceService } from "../../core/services/finance.service";

type MovementType = "income" | "expense";

@Component({
  selector: "app-finance",
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: "./finance.component.html",
  styleUrl: "./finance.component.css",
})
export class FinanceComponent {
  readonly finance = inject(FinanceService);
  private readonly fb = inject(FormBuilder);
  readonly filter = signal<"all" | MovementType>("all");
  readonly showForm = signal(false);
  readonly message = signal("");
  readonly editing = signal<FinanceMovement | null>(null);
  readonly showCategories = signal(false);
  readonly income = computed(() => this.finance.summary().income);
  readonly expenses = computed(() => this.finance.summary().expenses);
  readonly balance = computed(() => this.finance.summary().balance);
  readonly visibleMovements = computed(() => {
    const kind = this.filter();
    return this.finance.movements().filter((item) => kind === "all" || (kind === "income" ? item.kind === "ingreso" : item.kind === "egreso"));
  });
  readonly categoryTotals = computed(() => this.finance.categoryChart().map((item) => ({ label: item.name || item.category, amount: item.amount || item.total || 0 })));
  readonly maxCategory = computed(() => Math.max(...this.categoryTotals().map((item) => item.amount), 1));
  readonly monthlyChart = computed(() => this.finance.monthly().map((item) => ({ label: item.month, income: item.income ?? item.ingresos ?? 0, expenses: item.expenses ?? item.egresos ?? 0 })));
  readonly maxMonthly = computed(() => Math.max(...this.monthlyChart().flatMap(item => [item.income, item.expenses]), 1));

  readonly form = this.fb.nonNullable.group({
    type: ["expense" as MovementType, Validators.required],
    categoryId: ["", Validators.required],
    concept: ["", [Validators.required, Validators.maxLength(80)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    detail: ["", Validators.maxLength(180)],
  });
  readonly categoryForm = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.maxLength(50)]],
    kind: ["ambos" as FinanceKind, Validators.required],
  });

  openMovement(movement?: FinanceMovement) {
    this.editing.set(movement || null);
    this.form.reset(movement ? {
      type: movement.kind === "ingreso" ? "income" : "expense",
      categoryId: movement.categoryId,
      concept: movement.concept,
      amount: movement.amount,
      date: movement.date,
      detail: movement.detail || "",
    } : { type: "expense", categoryId: "", concept: "", amount: 0, date: new Date().toISOString().slice(0, 10), detail: "" });
    this.showForm.set(true);
  }

  async submit() {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const payload = {
      kind: value.type === "income" ? "ingreso" : "egreso",
      categoryId: value.categoryId,
      amount: value.amount,
      date: value.date,
      concept: value.concept.trim(),
      detail: value.detail.trim(),
    } as Omit<FinanceMovement, "id">;
    const saved = this.editing() ? await this.finance.updateMovement({ ...payload, id: this.editing()!.id }) : await this.finance.createMovement(payload);
    if (!saved) return;
    this.message.set("Movimiento registrado.");
    this.form.reset({ type: "expense", categoryId: "", concept: "", amount: 0, date: new Date().toISOString().slice(0, 10), detail: "" });
    this.showForm.set(false);
    this.editing.set(null);
  }

  async remove(id: string) {
    if (await this.finance.deleteMovement(id)) this.message.set("Movimiento eliminado.");
  }

  async createCategory() {
    if (this.categoryForm.invalid) return;
    if (await this.finance.createCategory(this.categoryForm.getRawValue())) this.categoryForm.reset({ name: "", kind: "ambos" });
  }

  async removeCategory(id: string) { await this.finance.deleteCategory(id); }

  categoryName(category: unknown, categoryId: string) {
    return typeof category === "object" && category !== null && "name" in category
      ? String(category.name)
      : this.finance.categories().find(item => item.id === categoryId)?.name || "Sin categoría";
  }

  categoryKind(kind: MovementType): FinanceKind { return kind === "income" ? "ingreso" : "egreso"; }
}
