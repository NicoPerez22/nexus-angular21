import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ElementRef, ViewChild } from "@angular/core";
import { WorkspaceService } from "../../core/services/workspace.service";
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
  teamEditing: Team | null = null;
  deleting: Team | null = null;
  attempted = false;
  message = signal("");
  @ViewChild("dialog") dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild("teamDialog") teamDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild("confirmation") confirmation!: ElementRef<HTMLDialogElement>;
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
  teamForm = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(60)]],
    short: ["", [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(8)]],
    sub: ["", [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(60)]],
    win: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });
  get players() {
    return this.form.controls.players;
  }
  add() {
    this.players.push(this.playerGroup());
  }
  openTeam(team?: Team) {
    this.teamEditing = team || null;
    this.attempted = false;
    this.teamForm.reset(team
      ? { name: team.name, short: team.short, sub: team.sub, win: team.win }
      : { name: "", short: "", sub: "", win: 0 });
    this.teamDialog.nativeElement.showModal();
  }
  async saveTeam() {
    this.attempted = true;
    if (this.teamForm.invalid) return;
    const value = this.teamForm.getRawValue();
    const saved = this.teamEditing
      ? await this.store.updateTeam({ ...this.teamEditing, ...value })
      : await this.store.createTeam(value);
    if (saved) {
      this.teamDialog.nativeElement.close();
      this.message.set(this.teamEditing ? "Equipo actualizado." : "Equipo creado.");
    }
  }
  requestDelete(team: Team) {
    this.deleting = team;
    this.confirmation.nativeElement.showModal();
  }
  async confirmDelete() {
    if (this.deleting && await this.store.deleteTeam(this.deleting.id)) {
      this.confirmation.nativeElement.close();
      this.message.set("Equipo eliminado.");
      this.deleting = null;
    }
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
  async save() {
    this.attempted = true;
    if (this.form.invalid || !this.editing) return;
    const players = this.players
      .getRawValue()
      .map((p) => ({ name: p.name.trim(), role: p.role.trim() }));
    if (await this.store.saveTeam({ ...this.editing, players })) {
      this.dialog.nativeElement.close();
      this.message.set("Roster actualizado.");
    }
  }
}
