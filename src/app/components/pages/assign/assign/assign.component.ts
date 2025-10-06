import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';


@Component({
  selector: 'uni-assign',
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.scss']
})
export class AssignComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    //{ 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
    { 'name': 'Cliente', 'attribute': 'nameClient' },
    { 'name': 'Fecha', 'attribute': 'date','config': {
      'formatDate': { format: 'dd/MM/yyyy hh:mm:ss a', locale: 'en-US' },
    } },
    //{ 'name': 'Proveedor', 'attribute': 'nameProvider' },
  ];
  public categoriesService: any[] = [];
  public persons: any[] = [];
  public assignServiceForm!: FormGroup;
  public pageSize: any = 5;
  public pageKey: any[];
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos
  public dataFilter: any = [];
  public dataService: any[];
  public functionDataCurrent: (pageSize: any) => any;

  private pagUtils: PaginationUtils | undefined;
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private personService: PersonService,
    private spinner: SpinnerService,
    private masterService: MasterService,
    private services: ServicesService,
    private mytoastr: MytoastrService
  ) {
    this.pagUtils = new PaginationUtils();
   }

  ngOnInit(): void {
    this.formService();
    this.listData();
    this.functionDataCurrent = this.dataInitial.bind(this);
    this.functionDataCurrent(this.pageSize);
  }

  formService() {
    this.assignServiceForm = this.fb.group({
      service_name: [''],
      service_type: [''],
      client: [''],
    })
  }

  listData() {
      this.spinner.spinnerOnOff();
      forkJoin([
        this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
        this.masterService.getItemsMasterTable('14') // CategoriaService
      ]).subscribe({
        next: (response) => {
          const [ person, categoryService] = response;
          this.persons = person.data;
          this.categoriesService = categoryService;
        },
        error: (error) => {
          this.spinner.spinnerOnOff();
          console.error("Error loading master table data:", error);
        },
        complete: () => {
          this.spinner.spinnerOnOff();
        },
      });
    }

  dataInitial(pageSize: any) {
    const input = this.service_name.value?.toUpperCase();
    const inputType = this.service_type.value?.toUpperCase();
    const idClient = this.client.value;

    this.spinner.spinnerOnOff();
    // return
    this.services.getServices(input, null, inputType, null, this.count, idClient, pageSize, this.pageKey, true).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        
        console.log("data.data.nextPageKey ver Items:");
        //console.log(data.data.nextPageKey);
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter
        this.dataService = this.dataFilter.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || ''
        }));
        //this.pageKey = data.data.nextPageKey ?? null;
        //this.count = data.data.Count ?? this.count;
      
        //console.log("data.data.nextPageKey:");
        //console.log(data.data.nextPageKey);
        //console.log("this.count:");
        //console.log(this.count);
        //console.log("data.data.Count:");
       // console.log(data.data.Count);
        if(this.dataService.length==this.count){//se recuperaron todos los datos
          this.pageKey = null;
        }else{
          this.pageKey = data.data.nextPageKey ?? null;
        }
        this.count = data.data.Count ?? this.count;
      },
      error: (err) => {
        console.log(err);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
        //this.close = true
      }
    })
  }

  dataInitialForExport() {
    if (this.pageKey) {  // Validamos pageKey en lugar de pageSize, si la tabla aun no esta llena
      console.log('Tabla incompleta, cargando más datos antes de exportar...');
      this.dynamic.shouldExport = true; // 🔹 decimos al hijo: “exporta después de cargar”
      this.functionDataCurrent(this.count);
    }else{//si tabla ya esta llena, llamar la fn exportar del hijo
      console.log('Tabla completa, exportando directamente...');
      this.dynamic.exportarDataExcel();
    }
  }
  //Redireccionar a asignación individual(1) o masiva(2)
  redirectAsign(type: number) {
    if (type === 1) {
      this.router.navigate(['../assign/individual']);
    } else if (type === 2) {
      this.router.navigate(['../assign/massive']);
    }
  }


  searchData() {
    if (!this.service_name.value && !this.service_type.value && !this.client.value) {
      this.mytoastr.showWarning('Ingrese un valor válido', '')
      return
    }
    this.clearData();
    this.dataInitial(this.pageSize);
  }

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataService = [];
    this.dataFilter = [];
  }
  
  reload() {
     this.clearData();
    this.dynamic.clearSelection();
    this.dataInitial(this.pageSize);
    //this.dataInitial(this.pageSize);
    // this.functionDataCurrent(this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
}

  /************************************* METODOS DE BOTONES ***********************************/
  clearFormAndData() {
    this.clearData();
    this.assignServiceForm.reset();
    this.dataInitial(this.pageSize);
  }



  get service_name() {
    return this.assignServiceForm.get('service_name')
  }

  get service_type() {
    return this.assignServiceForm.get('service_type')
  }

  get client() {
    return this.assignServiceForm.get('client')
  }

}
