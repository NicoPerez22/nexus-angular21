import { Component, inject, signal, computed } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { WorkspaceService } from "../../core/services/workspace.service";
@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css",
})
export class ShellComponent {
  store = inject(WorkspaceService);
}
