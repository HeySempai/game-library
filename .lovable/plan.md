

## Problema

`package.json` no tiene el script `build:dev` que el sistema de preview necesita para compilar el proyecto. Mis edits anteriores no persistieron.

## Solución

Agregar `"build:dev": "vite build --mode development"` a la sección `scripts` de `package.json`.

## Cambio exacto

En `package.json`, línea 10, después de `"preview": "vite preview"`, agregar una coma y el nuevo script:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Un solo cambio, una sola línea.

