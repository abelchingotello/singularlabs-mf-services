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
    serviceTypeName: string;//Este valor lo suelen llenar en el front
    status: string;
    indicators: any[];
    additional: any[];
    id_serviceProv: string;
    fixedcomission: number;//fixedcomission
    pctcomission: number;//pctcomission
    typeComission: string;
    rangecomission: string;
    comissionCriterion: number;
}
