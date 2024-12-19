import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
  public close : boolean = false;
  public serviceForm!: FormGroup;
  public dataFilter : any;
  public dataService : any[]

  constructor(
    private router : Router,
    private services : ServicesService,
    private fb: FormBuilder,
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


  data() {
    this.dataService = this.dataFilter.data.map(item => ({
      ...item,
      serviceTypeName: item.serviceType?.name || ''
    }));
  }


  get service_name(){
    return this.serviceForm.get('service_name')
  }


}
