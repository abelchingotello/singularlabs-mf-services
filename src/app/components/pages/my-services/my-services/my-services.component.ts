import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
import { ServicesService } from 'src/app/services/services.service';

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
  ];
  public options: any[] = [
    { value: 'Servicio', id:'1'},
    { value: 'Entidad-Servicio', id:'2'},
    { value: 'Client-Servicio', id:'3'},
  ]
  public pageSize: any = 5;
  public pageKey: any[];
  public dataService : any[];


    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  constructor(
    private service : ServicesService,
    private auth : AuthService
  ) { }

  ngOnInit(): void {
    this.service.getIdServicePerson('61299700').subscribe({
      next: (value) => {
          this.dataService = value.data.map(item => ({
            ...item,
            serviceTypeName: item.serviceType?.name || ''
          }));
          console.log("valor id: ",value)
      },
    })
  }

}
