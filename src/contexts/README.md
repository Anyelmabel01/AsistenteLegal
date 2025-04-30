# Contextos de la Aplicación

## Información Importante sobre Autenticación

El contexto de autenticación debe importarse siempre de:

```typescript
import { useAuth, AuthProvider } from '../contexts/auth';
```

**NO** importar de `AuthContext.tsx` pues este archivo ha sido eliminado.

## Uso correcto

El hook `useAuth` **SIEMPRE** debe usarse dentro de componentes que sean hijos de `AuthProvider`. Asegúrate de que cualquier componente que use `useAuth` esté envuelto en `AuthProvider`.

```tsx
// Correcto ✅
function Page() {
  return (
    <AuthProvider>
      <ComponenteQueUsaAuth />
    </AuthProvider>
  );
}

// Incorrecto ❌
function Page() {
  const { user } = useAuth(); // Error: useAuth debe usarse dentro de AuthProvider
  return <div>...</div>;
}
```

## Solución de problemas

Si obtienes el error "useAuth must be used within an AuthProvider", asegúrate de:

1. Que estás importando desde 'auth.tsx' y no de 'AuthContext.tsx'
2. Que el componente que usa useAuth está envuelto en AuthProvider
3. Que el AuthProvider está en el árbol de componentes antes que cualquier llamada a useAuth 