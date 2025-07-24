export interface PageInterface<T> {//Interface para el servicio de obtener un servicio por id
    Items: T[]; // Array de elementos de tipo T
    Count: number; // Número total de elementos
    nextPageKey: any; // Clave de la siguiente página, opcional
    hasMore: boolean; // Indica si hay más elementos para cargar
}
