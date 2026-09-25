// Estados de un punto de revisión técnica. variant = Bootstrap/Badge; excel = relleno ARGB del reporte.
export const STATUS = {
    bien: { label: 'Bien', variant: 'success', excel: 'FFC8E6C9' },
    regular: { label: 'Regular', variant: 'warning', excel: 'FFFFF9C4' },
    deficiente: { label: 'Deficiente', variant: 'danger', excel: 'FFFFCDD2' },
};

export const STATUS_NOT_APPLICABLE = { label: 'No aplica', variant: 'secondary', excel: 'FFF5F5F5' };

export const STATUS_OPTIONS = Object.keys(STATUS);

export const getStatus = (status) => STATUS[status?.toLowerCase?.()] ?? STATUS_NOT_APPLICABLE;
