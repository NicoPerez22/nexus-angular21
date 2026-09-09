import { Component, inject, signal, computed } from "@angular/core";
import { input, output } from "@angular/core";
import { DatePipe } from "@angular/common";
import { WorkspaceService } from "../../core/services/workspace.service";
import { Task } from "../../core/models/workspace.models";
@Component({
  selector: "app-task-list",
  standalone: true,
  imports: [DatePipe],
  templateUrl: "./task-list.component.html",
  styleUrl: "./task-list.component.css",
})
export class TaskListComponent {
  store = inject(WorkspaceService);
  tasks = input<Task[]>([]);
  editable = input(false);
  edit = output<Task>();
  remove = output<Task>();
}
