export interface ServiceTableInterface {//Interface para el servicio de obtener un los servicios con filtros para la tabla
    id: string;
    idProvider: string;
    idClient: string;
    nameProvider: string;
    nameClient: string;
    business: string;
    name: string;
    description: string;
    serviceType: any;
    status: string;
    indicators: any[];
    additional: any[];
    id_serviceProv: string;
}
