import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient,
  ) { }

  postPerson(data:any):Observable<any> {
    return this.httpClient.post(`${this.url}/person`, data);
  }

  postIdPerson(id:string):Observable<any> {
    return this.httpClient.post(`${this.url}/person/${id}`,null);
  }


  getPerson(typeEntity?:string,nameAlias?:string):Observable<any> {
    let params = new HttpParams();
    if(typeEntity) params = params.set('typeEntity', typeEntity);
    
    if(nameAlias) params = params.set('nameAlias', nameAlias);

    return this.httpClient.get(`${this.url}/person/entity`, {params:params});
  }
  
}
