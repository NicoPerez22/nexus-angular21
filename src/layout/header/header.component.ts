import { Component, inject, signal, computed } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
@Component({
  selector: "app-header",
  standalone: true,
  imports: [],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
})
export class HeaderComponent {
  router = inject(Router);
  auth = inject(AuthService);
  logout() { this.auth.logout(); this.router.navigateByUrl("/login"); }
  current = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    { initialValue: null },
  );
  label = computed(() => {
    this.current();
    return (
      (
        {
          resumen: "Resumen",
          equipos: "Equipos",
          calendario: "Calendario",
          tareas: "Tareas",
        } as Record<string, string>
      )[this.router.url.split("/")[1]?.split("?")[0]] || "Resumen"
    );
  });
}
