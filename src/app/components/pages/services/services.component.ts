import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogServiceStatusComponent } from 'src/app/dialogs/dialog-service-status/dialog-service-status.component';
import { ServicesService } from 'src/app/services/services.service';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PageEvent } from '@angular/material/paginator';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';

@Component({
  selector: 'uni-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
    { 'name': 'Proveedor', 'attribute': 'nameProvider' },
    { 'name': 'Cliente', 'attribute': 'nameClient' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];
  public options: any[] = [
    { value: 'Servicio', id: '1' },
    { value: 'Entidad-Servicio', id: '2' },
    { value: 'Client-Servicio', id: '3' },
  ]

  public pageSize: any = 5;
  public pageKey: any[];
  public close: boolean = false;
  public serviceForm!: FormGroup;
  public dataFilter: any = [];
  public dataService: any[];
  public functionDataCurrent: (pageSize: any) => any;
  public disabledEditOption: any
  public editOption: any;
  public selectedIds: any;
  public stateMaster: any;
  public idClient: any;
  public idProvider: any;
  public dataIdService: any;
  public optionId: any
  private pagUtils: PaginationUtils | undefined;
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private router: Router,
    private services: ServicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service: ServicesService,
    private master: MasterService,
    private person: PersonService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formService();
    this.dataMaster();

    // Suscribirse a cambios y convertir a mayúsculas
    this.service_name?.valueChanges.subscribe(value => {
      if (value) {
        this.service_name?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });
    this.functionDataCurrent = this.dataInitial.bind(this);
    this.functionDataCurrent(this.pageSize);


  }

  dataInitial(pageSize: any) {
    const input = this.service_name.value?.toUpperCase();
    const inputType = this.service_type.value?.toUpperCase();
    const inputStatus = this.status.value?.master_name?.toUpperCase();

    this.spinner.spinnerOnOff();
    // return
    this.services.getServices(input, inputStatus,inputType, this.count, pageSize, this.pageKey).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter
        // this.dataFilter = data;
        this.dataService = this.dataFilter.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || ''
        }));
        console.log('dataService', this.dataService);
        this.pageKey = data.data.nextPageKey ?? null;
        this.count = data.data.Count ?? 0;
      },
      error: (err) => {
        console.log(err);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
        this.close = true
      }
    })
  }


  formService() {
    this.serviceForm = this.fb.group({
      service_name: [''],
      service_type: [''],
      status: ['']
    })
  }

  addService() {
    this.router.navigate(['service/add'])
  }

  updateService() {
    this.router.navigate(['service/import'])
  }

  searchData() {
    if (!this.service_name.value && !this.status.value && !this.service_type.value) {
      this.mytoastr.showWarning('Ingrese un valor válido', '')
      return
    }
    this.clearData();
    this.dataInitial(this.pageSize);
  }

  cleanSearch() {
    this.service_name.setValue('')
    this.close = false;
    this.clearData();
  }

  selectOption(event) {
    this.optionId = event.value
    // if(this.optionId.id == '1'){
    this.openDialogType(this.optionId.id);
    // }
  }

  editElement() {
    // this.selectedIds
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
  }

  handleSelectedIds(selectedIds: any[]) {
    this.disabledEditOption = selectedIds.length !== 1;
    this.editOption = selectedIds.length == 1;
    this.selectedIds = selectedIds;
    if (this.selectedIds.length === 1) {

      this.getIdService(selectedIds)

    }
  }

  selectedHandle(event:any) {
    console.log('event',event);
    if (this.selectedIds.length === 1) {
      this.spinner.spinnerOnOff();
      let completedRequests = 0; // Contador para peticiones completadas

      const checkAndStopSpinner = () => {
        completedRequests++;
        if (completedRequests === 2) {
          this.spinner.spinnerOnOff(); // Desactivar spinner cuando ambas peticiones terminen
        }
      };
      this.getIdPerson(event[0].idClient, null, checkAndStopSpinner)
      this.getIdPerson(null, event[0].idProvider, checkAndStopSpinner)
    }
  }


  dataMaster() {
    this.master.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  getIdService(idService) {
    this.service.getIdServices(idService).subscribe({
      next: (response) => {
        this.dataIdService = response
      },
      error: (error) => {
        console.error('Error:', error);
      }
    })
  }

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataService = [];
    this.dataFilter = [];
    // this.reload();
  }

  reload() {
    // this.clearData();
    this.dynamic.clearSelection();
    this.dataInitial(this.pageSize);
    // this.functionDataCurrent(this.pageSize);
  }

  getIdPerson(idClient?: string, idProvider?: string, callback?: () => void) {
    const id = idClient || idProvider
    this.person.postIdPerson(id).subscribe({
      next: (response) => {
        
        // this.spinner.spinnerOnOff();
        if (idClient) this.idClient = response.data[0];
        if (idProvider) this.idProvider = response.data[0];
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {
        if (callback) callback();
        console.log('complete');
      },
    })
  }


  openDialogType(stateId: string): void {

    const dialogRef = this.dialog.open(DialogServiceStatusComponent, {
      width: '900px',
      data: {
        resp: this.dataIdService,
        id: stateId,
        state: this.stateMaster,
        idClient: this.idClient,
        idProvider: this.idProvider
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.reload();
      this.searchData();
    });
  }

  asignationService() {
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
  }

  /************************************* METODOS DE BOTONES ***********************************/
  clearFormAndData() {
    this.clearData();
    this.serviceForm.reset();
    this.dataInitial(this.pageSize);
  }


  /******************************** METODOS DE PAGINADO *************************************/
  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }


  /******************************************** METODOS GET ****************************************/

  get service_name() {
    return this.serviceForm.get('service_name')
  }

   get service_type() {
    return this.serviceForm.get('service_type')
  }

  get status() {
    return this.serviceForm.get('status')
  }


}
