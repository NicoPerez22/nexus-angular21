import { Component, inject, signal, computed } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe, DecimalPipe } from "@angular/common";
import { WorkspaceService } from "../../core/services/workspace.service";
import { localDate } from "../../core/data/seed";
import { EventListComponent } from "../../shared/event-list/event-list.component";
import { TaskListComponent } from "../../shared/task-list/task-list.component";
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    EventListComponent,
    TaskListComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {
  store = inject(WorkspaceService);
  today = localDate();
  todayEvents = computed(() =>
    this.store.events().filter((e) => e.date === this.today),
  );
  dueToday = computed(
    () => this.store.pending().filter((t) => t.due <= this.today).length,
  );
  next = computed(() =>
    this.store
      .events()
      .find((e) => e.type === "Competencia" && e.date >= this.today),
  );
}
