import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogServiceStatusComponent } from 'src/app/dialogs/dialog-service-status/dialog-service-status.component';
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
  public options: any[] = [
    { value: 'Act. servicio', id:'1'},
    { value: 'Act. Entidad-Servicio', id:'2'},
    { value: 'Act. Client-Servicio', id:'3'},
  ]
  public dataUser = [];
  public pageSize: any = 5;
  public pageKey: any[];
  public close : boolean = false;
  public serviceForm!: FormGroup;
  public dataFilter : any;
  public dataService : any[]

  constructor(
    private router : Router,
    private services : ServicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service : ServicesService,
  ) { }

  ngOnInit(): void {
    this.formService();
  }


  formService(){
    this.serviceForm = this.fb.group({
      service_name : ['']
    })
  }

  addService(){
    this.router.navigate(['service/add'])
  }

  searchData(){
    const input = this.service_name.value.toUpperCase();
    console.log("busqueda_ 0",input)
    
    // return
    this.services.getServices(input).subscribe({
      next : (data) => {
        this.dataFilter = data
        this.data();
        console.log(data);
      }
    })
    console.log("BUSCANDO....")
  }

  cleanSearch(){
    console.log("BORRANDO....")
  }

  optionId:any
  selectOption(event){
    this.optionId=event.value
    // if(this.optionId.id == '1'){
      this.openDialogType(this.optionId.id );
    // }
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
    if(this.selectedIds.length > 0){

      this.getIdService(selectedIds)
    }
    console.log("Id--s: ", selectedIds)
  }


  data() {
    this.dataService = this.dataFilter.data.map(item => ({
      ...item,
      serviceTypeName: item.serviceType?.name || ''
    }));
  }
  dataIdService
  getIdService(idService){
    this.service.getIdServices(idService).subscribe({
        next:(response)=>{
            this.dataIdService =  response
        }
    })
  }


  openDialogType(stateId:string): void {
    
    const dialogRef = this.dialog.open(DialogServiceStatusComponent, {
      width:'900px',
      data: {resp: this.dataIdService,id: stateId},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed',result);
      // this.animal = result;
    });
  }


  get service_name(){
    return this.serviceForm.get('service_name')
  }


}
