import { Component, inject, signal, computed } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ElementRef, ViewChild } from "@angular/core";
import { WorkspaceService } from "../../core/services/workspace.service";
import { localDate } from "../../core/data/seed";
import { Team } from "../../core/models/workspace.models";
@Component({
  selector: "app-teams",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./teams.component.html",
  styleUrl: "./teams.component.css",
})
export class TeamsComponent {
  store = inject(WorkspaceService);
  fb = inject(FormBuilder);
  editing: Team | null = null;
  attempted = false;
  message = signal("");
  @ViewChild("dialog") dialog!: ElementRef<HTMLDialogElement>;
  playerGroup(name = "", role = "") {
    return this.fb.nonNullable.group({
      name: [
        name,
        [
          Validators.required,
          Validators.pattern(/.*\S.*/),
          Validators.maxLength(40),
        ],
      ],
      role: [
        role,
        [
          Validators.required,
          Validators.pattern(/.*\S.*/),
          Validators.maxLength(40),
        ],
      ],
    });
  }
  form = this.fb.group({
    players: this.fb.array<ReturnType<TeamsComponent["playerGroup"]>>([]),
  });
  get players() {
    return this.form.controls.players;
  }
  add() {
    this.players.push(this.playerGroup());
  }
  open(team: Team) {
    this.editing = team;
    this.attempted = false;
    this.players.clear();
    team.players.forEach((p) =>
      this.players.push(this.playerGroup(p.name, p.role)),
    );
    this.dialog.nativeElement.showModal();
  }
  save() {
    this.attempted = true;
    if (this.form.invalid || !this.editing) return;
    const players = this.players
      .getRawValue()
      .map((p) => ({ name: p.name.trim(), role: p.role.trim() }));
    if (this.store.saveTeam({ ...this.editing, players })) {
      this.dialog.nativeElement.close();
      this.message.set("Roster actualizado.");
    }
  }
}
