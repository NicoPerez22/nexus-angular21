import { Component, inject, signal, computed } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { WorkspaceService } from "../../core/services/workspace.service";
import { AuthService } from "../../core/services/auth.service";
import { OrganizationService } from "../../core/services/organization.service";
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
  organization = inject(OrganizationService);
  router = inject(Router);
  links = [
    { path: "/resumen", label: "Resumen", icon: "◫" },
    { path: "/equipos", label: "Equipos", icon: "♧" },
    { path: "/calendario", label: "Calendario", icon: "▦" },
    { path: "/tareas", label: "Tareas", icon: "☑" },
    { path: "/finanzas", label: "Finanzas", icon: "$" },
    { path: "/scouting", label: "Scouting", icon: "◎" },
  ];
  isAdmin() {
    return this.auth.user()?.role === "admin";
  }
  async logout() {
    await this.auth.logout();
    this.router.navigateByUrl("/login");
  }
}
