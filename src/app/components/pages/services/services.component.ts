import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'uni-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName'},
  ];
  public dataUser = [];
  public pageSize: any = 5;
  public pageKey: any[];
  public close : boolean = false

  constructor(
    private router : Router,
    private services : ServicesService
  ) { }

  ngOnInit(): void {
    this.services.getServices('COLEGIO').subscribe({
      next : (data) => {
        console.log(data);
      }
    })
    this.data();
  }

  addService(){
    this.router.navigate(['service/add'])
  }

  searchData(){
    console.log("BUSCANDO....")
  }

  cleanSearch(){
    console.log("BORRANDO....")
  }

  editElement() {
    // this.selectedIds
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
  }
  
  public disabledEditOption: any
  public selectedIds: any

  handleSelectedIds(selectedIds: any[]) {
    // console.log("Id's: ", selectedIds)
    // this.disabledDeletOption = selectedIds.length !== 1;
    this.disabledEditOption = selectedIds.length !== 1;
    this.selectedIds = selectedIds;
    console.log("Id--s: ", selectedIds)
  }

  dataService

  data(){
    this.dataService = this.data1.map(item => ({
      ...item,
      serviceTypeName: item.serviceType?.name || ''
  }));
  console.log("DATA",this.dataService)

  }






    data1= [
      {
          "id": "SAC0000015",
          "name": "ENTEL POSTPAGO",
          "description": "ENTEL POSTPAGO",
          "serviceType": {
              "id": "5",
              "name": "TELEFONIAS"
          }
      },
      {
          "id": "SAC0000004",
          "name": "SEDAPAL",
          "description": "SEDAPAL",
          "serviceType": {
              "id": "4",
              "name": "SERV. PUBLICOS"
          }
      },
      {
          "id": "SAC0000002",
          "name": "PASVELA",
          "description": "PASVELA",
          "serviceType": {
              "id": "2",
              "name": "EMPRESAS"
          }
      },
      {
          "id": "SAC0000022",
          "name": "SEDAPAR",
          "description": "SEDAPAR",
          "serviceType": {
              "id": "4",
              "name": "SERV. PUBLICOS"
          }
      }
  ]


}
