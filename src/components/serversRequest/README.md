# WordGenerator Component

Componente de React para generar documentos Word desde plantillas.

## Características

- Carga plantillas Word (.docx)
- Reemplaza variables en la plantilla con datos del formulario
- Genera y descarga el documento resultante
- Soporte para campos personalizados

## Uso

```jsx
import WordGenerator from './components/word-generator';

function App() {
  return <WordGenerator />;
}
```

## Dependencias

- `docxtemplater`: Procesamiento de plantillas Word
- `pizzip`: Manejo de archivos ZIP
- `file-saver`: Descarga de archivos

## Variables en plantillas

Usa variables con llaves en tus plantillas Word:
- `{nombre}`
- `{empresa}`
- `{fecha}`
- `{cargo}`
- `{email}`
- `{telefono}`
