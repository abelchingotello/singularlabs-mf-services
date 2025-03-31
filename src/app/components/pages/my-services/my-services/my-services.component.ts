import { Component, OnInit, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-my-services',
  templateUrl: './my-services.component.html',
  styleUrls: ['./my-services.component.scss']
})
export class MyServicesComponent implements OnInit {


  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName'},
    { 'name': 'Proveedor', 'attribute': 'idProvider'},
    { 'name': 'Cliente', 'attribute': 'idClient'},
    { 'name': 'Estado', 'attribute': 'status','config':{
      'styleClass':true
    }},
  ];
  public options: any[] = [
    { value: 'Servicio', id:'1'},
    { value: 'Entidad-Servicio', id:'2'},
    { value: 'Client-Servicio', id:'3'},
  ]
  public pageSize: any = 5;
  public pageKey: any[];
  public dataService : any[];
  public personId : string;
  public prefix : string;

    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  constructor(
    private service : ServicesService,
    private cookie : CookieService,
    private spinner : SpinnerService

  ) { }

  ngOnInit(): void {
    this.spinner.spinnerOnOff();
    this.personId = this.cookie.get('person_id');
    this.prefix = this.cookie.get('prefix')
    

    this.service.getIdServicePerson(this.personId,this.prefix).subscribe({
      next: (value) => {
          this.dataService = value.data.map(item => ({
            ...item,
            serviceTypeName: item.serviceType?.name || ''
          }));
          console.log("valor id: ",value)
      },
      error:(err)=> {
          console.error("error: ",err)
      },
      complete:()=> {
          this.spinner.spinnerOnOff();
      },
    })
  }

}
