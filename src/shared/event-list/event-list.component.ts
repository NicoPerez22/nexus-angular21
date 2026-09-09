import { Component, inject, signal, computed } from "@angular/core";
import { input, output } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TeamEvent } from "../../core/models/workspace.models";
@Component({
  selector: "app-event-list",
  standalone: true,
  imports: [DatePipe],
  templateUrl: "./event-list.component.html",
  styleUrl: "./event-list.component.css",
})
export class EventListComponent {
  events = input<TeamEvent[]>([]);
  editable = input(false);
  edit = output<TeamEvent>();
  remove = output<TeamEvent>();
}
