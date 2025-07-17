import { Attribute, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MasterInterface } from '../interfaces/masterInterface';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  private url = `${environment.URL_API_GATEWAY}/master`;
  data = new BehaviorSubject<any[]>(null);
  dataParent = new BehaviorSubject<any>(null);

  constructor(private httpClient: HttpClient) { }

  getItemsMasterTable(group) : Observable <MasterInterface[]> {
    let params = new HttpParams()
    .set('group', group);
    return this.httpClient.get<MasterInterface[]>(`${this.url}/group`, {params: params});
  }
  

}
