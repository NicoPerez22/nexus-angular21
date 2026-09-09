import { Component, inject, signal, computed } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  show = signal(false);
  error = signal("");
  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set("Completá un correo válido y tu contraseña.");
      return;
    }
    const v = this.form.getRawValue();
    if (this.auth.login(v.email, v.password)) {
      const target = this.route.snapshot.queryParamMap.get("returnUrl");
      this.router.navigateByUrl(
        target && /^\/(resumen|equipos|calendario|tareas)(\?|$)/.test(target)
          ? target
          : "/resumen",
      );
    } else {
      this.error.set(
        "No se pudo iniciar sesión. Revisá las credenciales de demostración y que el navegador permita almacenamiento.",
      );
    }
  }
}
