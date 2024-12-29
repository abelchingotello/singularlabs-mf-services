import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient
  ) { }


  registerService(data:any):Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/register`,data);
  }

  getServices(name:string): Observable<any>{
    let params = new HttpParams()
    .set('nombre', name);
    return this.httpClient.get<any>(`${this.url}/servicios`,{params: params});
  }

  getIdServices(id:string): Observable<any>{
    return this.httpClient.post<any>(`${this.url}/servicios/${id}`,null);
  }

  getPerson(typeEntity?:string,nameAlias?:string):Observable<any> {
    let params = new HttpParams();
    if(typeEntity) params = params.set('typeEntity', typeEntity);
    
    if(nameAlias) params = params.set('nameAlias', nameAlias);

    return this.httpClient.get(`${this.url}/person/entity`, {params:params});
  }
}



// {
//   "idProvider": "00000100",// ID ´PROVEEDOR 
//   "idClient": "00000700", //ID DE RECAUDADORA
//   "idServiceProv": "00110010002267012", //id de convenio
//   "serviceName": "COLEGIO CARMELITAS", nnomb de servicio
//   "userRegistration": "DEYNER",
//   "idTypeService": "1", 
//   "typeService": "COLEGIOS",//master
//   "business": "COLEGIO CARMELITAS", //nombre de negocio
//   "status": "HABILITADO",
//   "zone": "LIMA",
//   "collectorName": "",//vacio cuando son clientes // somos proveedores
//   "commission": { //proveedor
//     "fixed": "1", //number
//     "criterion": "600", //number
//     "percentage": "5%", //number decimal
//     "type": "MULTIPLE" // fija multiple porcentual
//   },
//   "ownCommission": { //cliente
//     "fixed": "1.5", //numeber
//     "criterion": "600", //number
//     "percentage": "5%", //number
//     "type": "MULTITPLE"
//   },
//   "indicators": [ usar para enviar
//     {
//       "id": "PAY_BILL",
//       "name": "BASE DE DATOS",
//       "isActive": true
//     },
//     {
//       "id": "PAY_PARTIAL",
//       "name": "PAGO PARCIAL",
//       "isActive": false
//     },
//     {
//       "id": "PAY_CARD",
//       "name": "PAGO CON TARJETA",
//       "isActive": true
//     },
//     {
//       "id": "FREQUENT_OPERATION",
//       "name": "OPERACION FRECUENTE",
//       "isActive": true
//     },
//     {
//       "id": "PAY_DEBT_OLDEST",
//       "name": "DEUDA MAS ANTIGUA",
//       "isActive": true
//     },
//     {
//       "id": "PAY_ONLINE",
//       "name": "INTERCONECTADO, PAGO EN LINEA",
//       "isActive": false
//     },
//     {
//       "id": "PAY_ACCOUNT",
//       "name": "PAGO CON CARGO EN CUENTA",
//       "isActive": true
//     },
//     {
//       "id": "PAY_REFLECTED",
//       "name": "REFLEJO DE PAGO",
//       "isActive": false
//     },
//     {
//       "id": "PAY_AUTOMATIC",
//       "name": "DEBITO AUTOMATICO",
//       "isActive": false
//     },
//     {
//       "id": "PAY_FIXED_RATE",
//       "name": "TASAS FIJAS",
//       "isActive": false
//     },
//     {
//       "id": "PAY_CASH",
//       "name": "PAGO EN EFECTIVO",
//       "isActive": true
//     },
//     {
//       "id": "PAY_CHECK_INTERNAL",
//       "name": "PAGO CON CHEQUE PROPIO BANCO",
//       "isActive": true
//     },
//     {
//       "id": "PAY_CHECK_EXTERNAL",
//       "name": "PAGO CON CHEQUE OTRO BANCO",
//       "isActive": true
//     },
//     {
//       "id": "PAY_MULTIPLE_PAYMENTS",
//       "name": "ACTUALIZACION MASIVA DE DEUDAS",
//       "isActive": false
//     }
//   ],
//   "additionalPaymentFields": [ // estructura si va asi
//     {
//       "id": "001",
//       "name": "CODIGO DE ALUMNO",
//       "fieldType": {
//         "id": "N",
//         "name": "NUMERICO"
//       },
//       "fieldMask": "00000I",
//       "maximumLength": 5,
//       "isMandatory": true,
//       "isEditable": true
//     },
//     {
//       "id": "002",
//       "name": "MES DE PAGO",
//       "fieldType": {
//         "id": "A",
//         "name": "ALFANUMERICO"
//       },
//       "fieldMask": "D                                           ",
//       "maximumLength": 43,
//       "isMandatory": false,
//       "isEditable": false
//     }
//   ]
// }