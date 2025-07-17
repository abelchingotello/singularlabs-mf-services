export interface ServiceByIdInterface {//Interface para el servicio de obtener un servicio por id
    id: string;//id
    idProvider: string;//idProvider
    idClient: string;//idClient
    business: string;//business
    name: string;//name
    description: string;//description
    serviceType: any;//Aqui viene un json con un id y name
    id_serviceProv: string;//id_serviceProv
    status: string;//status
    serviceProvider: string;//serviceProvider
    indicators: any[];//indicators
    'additional-payment-fields': any[];//Asi viene en el json
    fixedcomission: number;//fixedcomission
}
