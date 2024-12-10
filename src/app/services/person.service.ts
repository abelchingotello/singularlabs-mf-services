import { HttpClient } from '@angular/common/http';
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
    return this.httpClient.post(`${this.url}/persons`, data);
  }
  
}
