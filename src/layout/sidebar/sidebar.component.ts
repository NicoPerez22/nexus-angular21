import { Component, inject, signal, computed } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { WorkspaceService } from "../../core/services/workspace.service";
import { AuthService } from "../../core/services/auth.service";
@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.css",
})
export class SidebarComponent {
  store = inject(WorkspaceService);
  auth = inject(AuthService);
  router = inject(Router);
  links = [
    { path: "/resumen", label: "Resumen", icon: "◫" },
    { path: "/equipos", label: "Equipos", icon: "♧" },
    { path: "/calendario", label: "Calendario", icon: "▦" },
    { path: "/tareas", label: "Tareas", icon: "☑" },
  ];
  logout() {
    this.auth.logout();
    this.router.navigateByUrl("/login");
  }
}
