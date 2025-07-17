export interface ResponseDTO<T> {
    statusCode: number; // Código de mensaje
    message: string; // Mensaje
    data: T; // Data
    code: string; // Código de catálogo de mensajes
}