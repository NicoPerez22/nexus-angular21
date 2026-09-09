# NEXUS HQ — Angular 21

Aplicación frontend para gestión interna de eSports. Conserva la base azul, negra y blanca del prototipo. Angular 21.2.22, componentes standalone, Signals, Reactive Forms y rutas lazy. Sin dependencias de Sites ni de ChatGPT para ejecutarla.

## Ejecutar

Requisitos: Node.js 24 LTS (recomendado) y npm. Angular 21 admite Node ^20.19.0, ^22.12.0 o ^24.0.0 y TypeScript >=5.9 <6.0: https://angular.dev/reference/versions.

1. Descomprimí el ZIP y abrí una terminal dentro de `nexus-angular21`.
2. Ejecutá `npm ci`.
3. Ejecutá `npm start`.
4. Abrí http://localhost:4200.

No hace falta instalar Angular CLI globalmente. Se incluye `package-lock.json`. La primera instalación necesita acceso a npm. Las fuentes de Google son opcionales; el diseño usa fuentes alternativas si no hay conexión.

## Acceso de demostración

- Correo: `admin@nexus.gg`
- Contraseña: `Nexus2026!`

El login valida estas credenciales de ejemplo y conserva la sesión en sessionStorage. Cerrar sesión elimina la sesión; los datos de trabajo se conservan. Las rutas internas redirigen al login si no hay sesión. Una URL interna abierta antes del login se recupera al entrar.

**Alcance:** frontend funcional en modo local. Este login no es autenticación segura de producción: la validación está en el navegador y los guards no sustituyen la autorización del servidor. No incluye backend, cuentas reales, recuperación de contraseña, sincronización multiusuario ni conexión con estadísticas de juegos. Los nombres, resultados y datos iniciales son de ejemplo. No ingreses información sensible en esta demo.

## Funciones

- Resumen con totales derivados de los equipos y tareas, agenda de hoy y próxima competencia.
- Equipos: edición de nombres y roles de jugadores, agregar y quitar jugadores del roster.
- Calendario: crear, editar, eliminar y filtrar eventos por equipo. Confirmación antes de eliminar.
- Tareas: crear, editar, completar, reabrir y eliminar; filtros de pendientes/completadas, responsable, fecha y prioridad.
- Formularios validados, diálogos con soporte nativo de teclado/Escape, feedback de guardado y estados vacíos.
- Diseño responsive; header, sidebar y footer independientes.
- Cambios persistentes en localStorage. La agenda inicial usa el día de la primera carga. Los horarios se muestran como hora Argentina, sin conversión entre zonas.

## Estructura

```text
src/
  app/
    app.component.ts / .html / .css
    app.config.ts
    app.routes.ts
    app.routes.spec.ts
  core/
    data/seed.ts
    guards/auth.guard.ts
    models/workspace.models.ts
    services/
      auth.service.ts
      workspace.service.ts
      workspace.service.spec.ts
  feature/
    login/login.component.ts / .html / .css
    dashboard/dashboard.component.ts / .html / .css
    teams/teams.component.ts / .html / .css
    calendar/calendar.component.ts / .html / .css
    tasks/tasks.component.ts / .html / .css
  layout/
    shell/shell.component.ts / .html / .css
    header/header.component.ts / .html / .css
    sidebar/sidebar.component.ts / .html / .css
    footer/footer.component.ts / .html / .css
  shared/
    event-list/event-list.component.ts / .html / .css
    task-list/task-list.component.ts / .html / .css
  index.html
  main.ts
  styles.css
```

`src/feature` está directamente dentro de `src`, como se solicitó. Cada página tiene TypeScript, HTML y CSS separados. `styles.css` contiene el tema compartido para conservar consistencia. Las páginas no usan manipulación manual del DOM para renderizar contenido; Angular maneja vistas, eventos, rutas y formularios. ViewChild se utiliza únicamente para abrir/cerrar diálogos nativos.

## Comandos

- `npm start`: servidor de desarrollo.
- `npm run build`: compilación de producción en `dist/nexus-hq/browser`.
- `npm test`: pruebas de persistencia, autenticación y navegación con Vitest y entorno DOM simulado.

El ZIP incluye código y configuración; no incluye node_modules, cachés o binarios compilados. El lockfile fija las dependencias reproducibles.

## Datos y conexión a un backend

`WorkspaceService` centraliza lectura y mutaciones; reemplazá su persistencia local por llamadas HTTP a tu API. `AuthService` centraliza el acceso; reemplazá las credenciales demo por un endpoint de sesión con validación y autorización en el servidor. Registrá `provideHttpClient()` en `app.config.ts` al hacer esa integración. No guardes secretos en el frontend.

Los datos de esta demo pertenecen al navegador/origen, no a una cuenta remota. Para reiniciar la demostración, eliminá la clave `nexus.workspace.v1` de localStorage en las herramientas del navegador y recargá. Si el navegador bloquea el almacenamiento, la aplicación informa el fallo sin anunciar un guardado exitoso.

Para desplegar el build en un hosting SPA, configurá fallback de rutas hacia `index.html`; por ejemplo, `/equipos` debe servir la aplicación. No abras el build con `file://`.
