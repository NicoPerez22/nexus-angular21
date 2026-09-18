import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-users",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./users.component.html",
  styleUrl: "./users.component.css",
})
export class UsersComponent {
  private readonly auth = inject(AuthService);
  readonly message = signal("");
  readonly error = signal("");
  readonly saving = signal(false);
  attempted = false;

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    name: ["", [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    password: ["", [Validators.required, Validators.minLength(12)]],
    role: ["viewer" as "admin" | "coach" | "viewer", Validators.required],
  });

  async submit() {
    this.attempted = true;
    this.message.set("");
    this.error.set("");
    if (this.form.invalid) return;

    this.saving.set(true);
    const value = this.form.getRawValue();
    const created = await this.auth.createUser({
      email: value.email.trim().toLowerCase(),
      name: value.name.trim(),
      password: value.password,
      role: value.role,
    });
    this.saving.set(false);

    if (!created) {
      this.error.set("No se pudo crear el usuario. Revisá los datos o los permisos de administrador.");
      return;
    }
    this.message.set("Usuario creado correctamente.");
    this.form.reset({ email: "", name: "", password: "", role: "viewer" });
    this.attempted = false;
  }
}
