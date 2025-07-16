export interface ServiceByIdInterface {
    id: string;
    idProvider: string;
    idClient: string;
    business: string;
    name: string;
    description: string;
    serviceType: any;//Aqui viene un json con un id y name
    id_serviceProv: string;
    status: string;
    serviceProvider: string;
    indicators: any[];
    'additional-payment-fields': any[];//Asi viene en el json
    fixedcomission: number;
}
