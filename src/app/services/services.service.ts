import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private url = `${environment.URL_API_HUB}`;

  constructor(
    private httpClient: HttpClient
  ) { }


  getServices(name:string): Observable<any>{
    let params = new HttpParams()
    .set('nombre', name);
    return this.httpClient.get<any>(`${this.url}/servicios`,{params: params});
  }

  getIdServices(id:string): Observable<any>{
    return this.httpClient.post<any>(`${this.url}/servicios/${id}`,null);
  }
}
