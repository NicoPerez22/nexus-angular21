import { Component, inject, signal, computed } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ElementRef, ViewChild } from "@angular/core";
import { WorkspaceService } from "../../core/services/workspace.service";
import { localDate } from "../../core/data/seed";
import { ActivatedRoute, Router } from "@angular/router";
import { TeamEvent } from "../../core/models/workspace.models";
import { EventListComponent } from "../../shared/event-list/event-list.component";
@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [ReactiveFormsModule, EventListComponent],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.css",
})
export class CalendarComponent {
  store = inject(WorkspaceService);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  filter = signal("Todos");
  message = signal("");
  editing = "";
  attempted = false;
  deleting: TeamEvent | null = null;
  filters = computed(() => [
    "Todos",
    ...this.store.teams().map((t) => t.name),
    "Organización",
  ]);
  filtered = computed(() =>
    this.store
      .events()
      .filter((e) => this.filter() === "Todos" || e.team === this.filter()),
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
    team: ["Valorant", Validators.required],
    date: [localDate(), Validators.required],
    time: ["18:00", Validators.required],
    type: ["Entrenamiento", Validators.required],
  });
  ngAfterViewInit() {
    if (this.route.snapshot.queryParamMap.has("nuevo")) {
      queueMicrotask(() => {
        this.open();
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      });
    }
  }
  open(event?: TeamEvent) {
    this.attempted = false;
    this.editing = event?.id || "";
    this.form.reset(
      event
        ? {
            name: event.name,
            team: event.team,
            date: event.date,
            time: event.time,
            type: event.type,
          }
        : {
            name: "",
            team: this.store.teams()[0]?.name || "Organización",
            date: localDate(),
            time: "18:00",
            type: "Entrenamiento",
          },
    );
    this.dialog.nativeElement.showModal();
  }
  save() {
    this.attempted = true;
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (
      this.store.saveEvent({
        ...value,
        name: value.name.trim(),
        id: this.editing || crypto.randomUUID(),
      })
    ) {
      this.dialog.nativeElement.close();
      this.filter.set("Todos");
      this.message.set("Evento guardado.");
    }
  }
  requestDelete(event: TeamEvent) {
    this.deleting = event;
    this.confirmation.nativeElement.showModal();
  }
  confirmDelete() {
    if (this.deleting && this.store.deleteEvent(this.deleting.id)) {
      this.confirmation.nativeElement.close();
      this.message.set("Evento eliminado.");
    }
  }
}
