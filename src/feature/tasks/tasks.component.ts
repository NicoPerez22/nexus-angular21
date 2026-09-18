import { Component, inject, signal, computed } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ElementRef, ViewChild } from "@angular/core";
import { WorkspaceService } from "../../core/services/workspace.service";
import { localDate } from "../../core/data/seed";
import { Task } from "../../core/models/workspace.models";
import { TaskListComponent } from "../../shared/task-list/task-list.component";
@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [ReactiveFormsModule, TaskListComponent],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent {
  store = inject(WorkspaceService);
  fb = inject(FormBuilder);
  filter = signal("Todas");
  apiAreas = signal<string[]>([]);
  message = signal("");
  editing = "";
  done = false;
  attempted = false;
  deleting: Task | null = null;
  areas = computed(() => [
    ...this.store.teams().map((t) => t.name),
    ...this.apiAreas().filter((area) => !this.store.teams().some((team) => team.name === area)),
    "Staff técnico",
    "Contenido",
    "Organización",
  ]);
  filtered = computed(() =>
    this.store
      .tasks()
      .filter(
        (t) =>
          this.filter() === "Todas" ||
          (this.filter() === "Completadas" ? t.done : !t.done),
      ),
  );
  @ViewChild("dialog") dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild("confirmation") confirmation!: ElementRef<HTMLDialogElement>;
  form = this.fb.nonNullable.group({
    name: [
      "",
      [
        Validators.required,
        Validators.pattern(/.*\S.*/),
        Validators.maxLength(100),
      ],
    ],
    who: ["", [Validators.required, Validators.pattern(/.*\S.*/)]],
    team: ["Organización", Validators.required],
    due: [localDate(), Validators.required],
    priority: [false],
  });
  constructor() {
    void this.loadAreas();
  }
  private async loadAreas() {
    this.apiAreas.set(await this.store.getTaskAreas());
  }
  open(task?: Task) {
    this.attempted = false;
    this.editing = task?.id || "";
    this.done = task?.done || false;
    this.form.reset(
      task
        ? {
            name: task.name,
            who: task.who,
            team: task.team,
            due: task.due,
            priority: task.priority,
          }
        : {
            name: "",
            who: "",
            team: "Organización",
            due: localDate(),
            priority: false,
          },
    );
    this.dialog.nativeElement.showModal();
  }
  async save() {
    this.attempted = true;
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (
      await this.store.saveTask({
        ...v,
        name: v.name.trim(),
        who: v.who.trim(),
        id: this.editing || crypto.randomUUID(),
        done: this.done,
      })
    ) {
      this.dialog.nativeElement.close();
      this.message.set("Tarea guardada.");
    }
  }
  requestDelete(task: Task) {
    this.deleting = task;
    this.confirmation.nativeElement.showModal();
  }
  async confirmDelete() {
    if (this.deleting && await this.store.deleteTask(this.deleting.id)) {
      this.confirmation.nativeElement.close();
      this.message.set("Tarea eliminada.");
    }
  }
}
