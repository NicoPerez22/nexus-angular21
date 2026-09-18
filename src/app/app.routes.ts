import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "../core/guards/auth.guard";
import { adminGuard } from "../core/guards/admin.guard";
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
        title: "Resumen · HACHA HQ",
        loadComponent: () =>
          import("../feature/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "equipos",
        title: "Equipos · HACHA HQ",
        loadComponent: () =>
          import("../feature/teams/teams.component").then(
            (m) => m.TeamsComponent,
          ),
      },
      {
        path: "calendario",
        title: "Calendario · HACHA HQ",
        loadComponent: () =>
          import("../feature/calendar/calendar.component").then(
            (m) => m.CalendarComponent,
          ),
      },
      {
        path: "tareas",
        title: "Tareas · HACHA HQ",
        loadComponent: () =>
          import("../feature/tasks/tasks.component").then(
            (m) => m.TasksComponent,
          ),
      },
      {
        path: "usuarios",
        canActivate: [adminGuard],
        title: "Usuarios · HACHA HQ",
        loadComponent: () =>
          import("../feature/users/users.component").then(
            (m) => m.UsersComponent,
          ),
      },
      {
        path: "finanzas",
        title: "Finanzas · HACHA HQ",
        loadComponent: () =>
          import("../feature/finance/finance.component").then(
            (m) => m.FinanceComponent,
          ),
      },
      {
        path: "scouting",
        title: "Scouting · HACHA HQ",
        loadComponent: () =>
          import("../feature/scouting/scouting.component").then(
            (m) => m.ScoutingComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "resumen" },
];
