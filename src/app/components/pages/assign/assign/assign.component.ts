import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
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
import { DialogCommissionAssingServiceComponent } from 'src/app/dialogs/dialog-comision-assing-service/dialog-comision-assing-service.component';
import { environment } from 'src/environments/environment'
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'uni-assign',
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.scss']
})
export class AssignComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Id del servicio', 'attribute': 'id' },
    { 'name': 'Nombre', 'attribute': 'name' },
    //{ 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
    { 'name': 'Cliente', 'attribute': 'nameClient' },
    { 'name': 'Comision Fija', 'attribute': 'ownFixedComission' },
    { 'name': 'Comision Porcentual', 'attribute': 'ownPctComission' },
    {
      'name': 'Fecha', 'attribute': 'date', 'config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm:ss a', locale: 'en-US' },
      }
    },
    {
      name: 'Acciones',
      attribute: '',
      hide: this.router.url !== "/assign/admin",
      config: {
        type: 'buttonicons',
        actions: [
          {
            bgClass: 'yellow',
            toolTip: 'Editar Comision',
            icon: 'edit',
            value: 'edit'
          }
        ]
      }
    },
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
  public masterStatus: any[];
  public functionDataCurrent: (pageSize: any) => any;
  public currentUrl: any;
  private pagUtils: PaginationUtils | undefined;
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private personService: PersonService,
    private spinner: SpinnerService,
    private masterService: MasterService,
    private services: ServicesService,
    private mytoastr: MytoastrService,
    private dialog: MatDialog,
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
      this.masterService.getItemsMasterTable('14'), // CategoriaService
      this.masterService.getItemsMasterTable('1') // EStados
    ]).subscribe({
      next: (response) => {
        const [person, categoryService, status] = response;
        this.persons = person.data;
        this.categoriesService = categoryService;
        this.masterStatus = status;
        console.log("estadooooooos: ", this.masterStatus)
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
        if (this.dataService.length == this.count) {//se recuperaron todos los datos
          this.pageKey = null;
        } else {
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

  openDialogType(data: any): void {
    console.log("data: ", data)
    const typeCommission = data.fixedcomission && data.pctcomission ? "MULTIPLE" : data.fixedcomission ? "FIJO" : data.pctcomission ? "PORCENTUAL" : null;
    const dialogRef = this.dialog.open(DialogCommissionAssingServiceComponent, {
      width: '900px',
      data: {
        serviceName: data.name,
        serviceId: data.id,
        serviceStatus: data.status,
        serviceComisionFixed: data.ownFixedComission,
        serviceComisionPrc: data.ownPctComission,
        serviceTypeComission: data.ownTypeComission ?? typeCommission,
        serviceType: data.serviceType.name,
        clientName: data.nameClient ?? data.idClient,
        clientId: data.idClient,
        status: this.masterStatus,
        serviceIdProv: data.id_serviceProv,
        serviceComisionCriterio: data.ownComissionCriterion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === "200") {
        this.reload();
      }
    });
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

  clickButton(event) {
    console.log("event", event)
    const { value, element } = event
    if (value == "edit") {
      console.log("element: ", element)
      this.openDialogType(element)
    }
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      name: this.service_name.value?.toUpperCase() || undefined,
      type: this.service_type.value?.toUpperCase() || undefined,
      client: this.client.value || undefined,
    };

    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });
    const inbx = 'as';
    const token = localStorage.getItem('fcmToken');
    this.services.exportServices(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarning('', 'Procesando Archivo...')
        } else {
          this.mytoastr.showError('', 'Error al enviar la solicitud')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error durante la exportación:', error);
        this.mytoastr.showError('Error durante la exportación', '');
      }
    });
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
