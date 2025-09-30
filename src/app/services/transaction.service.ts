
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private url = `${environment.URL_API_GATEWAY}`;
  //private url = `${environment.URL_API_LOCAL}`; //LAMBDA LOCAL
  constructor(
    private httpClient: HttpClient,
  ) { }

  getTransaction(idclient?:string,idprovider?:string,status?:string,dateStart?:any, dateEnd?:any,idService?:string,limit?:any ,page?:any,numDoc?:string, count?: any,totalAmount?:any):Observable<any>{
    let params = new  HttpParams();

    console.log("idservicio: ",idService)

    if(numDoc !== undefined){
      params = params.set('concept',numDoc);
    }

    if(idclient !== undefined){
      params = params.set('idclient',idclient);
    }

    if(idprovider !== undefined){
      params = params.set('idprovider',idprovider);
    }

    if(status !== undefined){
      params = params.set('status',status);
    }

    if (dateStart !== undefined && dateStart !== null) {
      params = params.set('dateStart', dateStart);
    }
    if (dateEnd !== undefined && dateEnd !== null) {
      params = params.set('dateEnd', dateEnd);
    }

    if(idService !== undefined){
      params = params.set('idService',idService);
    }

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (Number(count) >= 0) {
      params = params.set('count', Number(count));
    }
    if (Number(totalAmount) >= 0) {
      params = params.set('totalAmount', Number(totalAmount));
    }
    return this.httpClient.get(`${this.url}/transactions`,{params});
  }

  getBalance(limit?:any ,page?:any,typeEntity?:any, entity?:any,typeAssign?:any,dateStart?:any,dateEnd?:any,count?:any):Observable<any>{
    let params = new  HttpParams();
    if(typeEntity !== undefined){
      params = params.set('typeEntity',typeEntity);
    }
    if (entity !== undefined) {
      params = params.set('entity', entity);
    }
    if (typeAssign !== undefined) {
      params = params.set('typeAssign', typeAssign);
    }
    if (dateStart !== undefined && dateStart !== null) {
      params = params.set('dateStart', dateStart);
    }
    if (dateEnd !== undefined && dateEnd !== null) {
      params = params.set('dateEnd', dateEnd);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (count >= 0) {
      params = params.set('count', Number(count));
    }
    return this.httpClient.get(`${this.url}/transactions/balances`,{params});
  }

   getCurrentBalances(limit?:any ,page?:any,typeEntity?:any, entity?:any,count?:any):Observable<any>{
    let params = new  HttpParams();
    if(typeEntity !== undefined){
      params = params.set('typeEntity',typeEntity);
    }
    if (entity !== undefined) {
      params = params.set('entity', entity);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (count >= 0) {
      params = params.set('count', Number(count));
    }
    return this.httpClient.get(`${this.url}/transactions/current-balances`,{params});
  }

  getIdTransaction(id:string,limit?:any ,pageKey?:any []):Observable<any>{
    let params = new  HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/transactions/${id}`,{params});
  }

  balanceVoucher(numberOperation:string){
    let params = new HttpParams();
    params = params.set('numberOperation', numberOperation);
    return this.httpClient.get(`${this.url}/transactions/voucher`,{params});
  }
  //-----Exportar de archivos
  exportTransactions(
    format: 'xlsx' | 'csv',
    filters: any
  ): Observable<HttpResponse<string>> {
    const params = new HttpParams({
      fromObject: {
        ...filters,
        format: format
      }
    });

    return this.httpClient.get(`${this.url}/transactions/export`, {
      params,
      observe: 'response',
      responseType: 'text' // para manejar base64
    });
  }
}
