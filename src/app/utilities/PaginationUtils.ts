export class PaginationUtils {
    resetIfChanged<T>(currentFunction: any, functionDataCurrent: any, clearDataCallback: () => void): any {
        if (functionDataCurrent !== currentFunction) {
            clearDataCallback();  // Llama a la función de limpieza que se pasa desde el componente
            console.log('Datos reseteados debido a un cambio en la función.');
        }
        return currentFunction;
    }

    // Método para manejar el cambio de página
    onPageChange(event: any, pageSize: any, functionCurrent: (pageSize: any) => void, pageKey: any) {
        pageSize = this.updatePageSize(event.pageSize, pageSize);
        console.log('onPageChange - pageKey:', pageKey);
        console.log('onPageChange - pageSize:', pageSize);
        this.paginationPage(pageSize, functionCurrent, pageKey);  // Pasamos pageKey a la función
    }

    onPageChangeTwo(event: any, pageSize: any, functionCurrent: (pageSize: any) => void, hasmore: any) {
        pageSize = this.updatePageSize(event.pageSize, pageSize);
        this.paginationPage(pageSize, functionCurrent, hasmore);  // Pasamos hasmore a la función
    }

    // Método que ejecuta la paginación
    paginationPage(pageSize: any, functionCurrent: (pageSize: any) => void, pageKey: any) {
        console.log('paginationPage - pageKey:', pageKey);
        console.log('paginationPage - pageSize:', pageSize);
        if (pageKey) {  // Validamos pageKey en lugar de pageSize
            console.log('Ejecutando functionCurrent');
            functionCurrent(pageSize);
        }
    }

    updatePageSize(newPageSize: any, currentPageSize: any): any {
        const newSize = Number(newPageSize);
        const currentSize = Number(currentPageSize);
        return newSize > currentSize ? newSize : currentSize;
    }
}