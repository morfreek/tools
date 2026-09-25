// Mensaje para el usuario a partir de un error de axios: distingue "la API rechazó"
// (su mensaje) de "no se pudo contactar la API"
export const apiErrorMessage = (error, fallback) => {
    if (!error?.response) return 'No se pudo contactar la API. Revise la conexión e intente de nuevo.';
    return error.response.data?.error || fallback;
};
