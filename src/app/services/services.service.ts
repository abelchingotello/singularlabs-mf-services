import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  public servicePayment = new BehaviorSubject<any[]>([]);

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient
  ) { }


  registerService(data:any):Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/register`,data);
  }

  registerServiceAssign(data:any):Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/assign`,data);
  }

  registerServiceImport(data:any):Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/register/massive`,data);
  }

  // getServices(name:string): Observable<any>{
  //   let params = new HttpParams()
  //   .set('name', name);
  //   return this.httpClient.get<any>(`${this.url}/services`,{params: params});
  // }

  getServices(name?:string,idClient?:string): Observable<any>{
    let params = new HttpParams()
    if(name){
      params = params.set('name', name);
    }
    // if(idClient){
    //   params = params.set('idClient', idClient);
    // }
    return this.httpClient.get<any>(`${this.url}/services`,{params: params});
  }

  getServicesPageKey(pageKey?:any[]): Observable<any>{
    let params = new HttpParams()
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get<any>(`${this.url}/services`,{params: params});
  }

  getTypeServices(name?:string): Observable<any>{
    let params = new HttpParams()
    if(name){
      params = params.set('name', name);
    }
    return this.httpClient.get<any>(`${this.url}/services/type`,{params: params});
  }

  getServicesData(): Observable<any>{
    return this.httpClient.get<any>(`${this.url}/services`);
  }

  getServicesCategory(): Observable<any>{
    return this.httpClient.get<any>(`${this.url}/services/category`);
  }

  getIdServices(id:string): Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/${id}`,null);
  }
  getIdServicePerson(id:string,type?:string): Observable<any>{
    let params = new HttpParams();

    if(type){
      params = params.set('idClient', type);
    }

    return this.httpClient.get<any>(`${this.url}/services/${id}`,{params:params});
  }

  getPerson(typeEntity?:string,nameAlias?:string):Observable<any> {
    let params = new HttpParams();
    if(typeEntity) params = params.set('typeEntity', typeEntity);
    
    if(nameAlias) params = params.set('nameAlias', nameAlias);

    return this.httpClient.get(`${this.url}/person/entity`, {params:params});
  }

  updateService(data:any):Observable<any>{
    return this.httpClient.patch(`${this.url}/services/status`,data);
  }

  updateServiceEntity(data:any):Observable<any>{
    return this.httpClient.patch(`${this.url}/services/status/entity`,data);
  }
  
  updateServiceClient(data:any):Observable<any>{
    return this.httpClient.patch(`${this.url}/services/status/one`,data);
  }

  detailService(id:string,value:string,ers:string):Observable<any>{
    let params = new HttpParams()
    .set('value', value)
    .set('ers', ers);
    return this.httpClient.post<any>(`${this.url}/services/${id}/bills`,null,{params:params});
  }

}
