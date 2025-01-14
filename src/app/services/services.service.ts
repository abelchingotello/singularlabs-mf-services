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

  getServices(name:string): Observable<any>{
    let params = new HttpParams()
    .set('name', name);
    return this.httpClient.get<any>(`${this.url}/services`,{params: params});
  }

  getIdServices(id:string): Observable<any>{
    return this.httpClient.post<any>(`${this.url}/services/${id}`,null);
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
