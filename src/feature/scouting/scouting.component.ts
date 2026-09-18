import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ScoutPlayer, ScoutTrait, ScoutingService } from "../../core/services/scouting.service";

@Component({
  selector: "app-scouting",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./scouting.component.html",
  styleUrl: "./scouting.component.css",
})
export class ScoutingComponent {
  readonly scouting = inject(ScoutingService);
  readonly search = signal("");
  readonly selected = this.scouting.selected;
  readonly players = this.scouting.players;
  readonly observationText = signal("");
  readonly traitName = signal("");
  readonly traitRating = signal(5);
  readonly filteredPlayers = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.scouting.players().filter(player => !query || `${player.name} ${player.role} ${player.game || ""}`.toLowerCase().includes(query));
  });

  async select(player: ScoutPlayer) {
    await this.scouting.getPlayer(player.id);
    this.observationText.set("");
  }
  async addObservation() {
    const player = this.selected();
    const text = this.observationText().trim();
    if (player && text && await this.scouting.addObservation(player.id, text)) this.observationText.set("");
  }
  async saveTrait() {
    const player = this.selected();
    const name = this.traitName().trim();
    if (!player || !name) return;
    const traits: ScoutTrait[] = [...(player.traits || []), { name, rating: this.traitRating() }];
    if (await this.scouting.replaceTraits(player.id, traits)) this.traitName.set("");
  }
  async deleteObservation(id: string) { await this.scouting.deleteObservation(id); }
}
