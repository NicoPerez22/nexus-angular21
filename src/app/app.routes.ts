import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "../core/guards/auth.guard";
export const routes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("../feature/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("../layout/shell/shell.component").then((m) => m.ShellComponent),
    children: [
      { path: "", pathMatch: "full", redirectTo: "resumen" },
      {
        path: "resumen",
        title: "Resumen · NEXUS HQ",
        loadComponent: () =>
          import("../feature/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "equipos",
        title: "Equipos · NEXUS HQ",
        loadComponent: () =>
          import("../feature/teams/teams.component").then(
            (m) => m.TeamsComponent,
          ),
      },
      {
        path: "calendario",
        title: "Calendario · NEXUS HQ",
        loadComponent: () =>
          import("../feature/calendar/calendar.component").then(
            (m) => m.CalendarComponent,
          ),
      },
      {
        path: "tareas",
        title: "Tareas · NEXUS HQ",
        loadComponent: () =>
          import("../feature/tasks/tasks.component").then(
            (m) => m.TasksComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "resumen" },
];
