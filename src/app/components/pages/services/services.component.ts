import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PageEvent } from '@angular/material/paginator';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { expand, filter, forkJoin, EMPTY, scan, startWith, lastValueFrom, finalize, map } from 'rxjs';
import { DialogServiceConfigComponent } from 'src/app/dialogs/dialog-service-config/dialog-service-config.component';

import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'uni-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'ID Servicio', 'attribute': 'id' },
    { 'name': 'ID Servicio - Proveedor', 'attribute': 'id_serviceProv' },
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Comision Fija', 'attribute': 'fixedcomission' },
    { 'name': 'Comision Porcentual', 'attribute': 'pctcomission' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
    { 'name': 'Modalidad de Recaudo', 'attribute': 'collectorMode' },
    { 'name': 'Proveedor', 'attribute': 'nameProvider' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        restriccPermission: true,
        actions: [
          {
            bgClass: 'yellow',
            toolTip: 'Editar Servicio',
            icon: 'edit',
            value: 'edit',
            permission: "services-updates-individual"
          },
          {
            bgClass: 'gray',
            toolTip: 'Configurar Servicio',
            icon: 'settings_applications',
            value: 'config_service',
            permission: "services-config"
          },
          {
            bgClass: 'blue',
            toolTip: 'Editar Campos Avanzados',
            icon: 'build_circle',
            value: 'config_service_plus',
            permission: "services-config-advanced"
            //permission: "services-config-advanced"
          }
        ]
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
  public dataIdService: any;
  public optionId: any
  public categoriesService: any[] = [];
  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];
  public allItems1: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';

  private readonly pagUtils: PaginationUtils | undefined;
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos
  public listProviders: any;
  public selectedCategory: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;


  constructor(
    private readonly router: Router,
    private readonly services: ServicesService,
    private readonly fb: FormBuilder,
    private readonly master: MasterService,
    private readonly person: PersonService,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
    private readonly personService: PersonService,
    public dialog: MatDialog,
    public authService: AuthService,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formService();//inicializa los inputs como vacios
    this.dataMaster();//carga lista de estados
    this.listData();//carga lista de tipos de servicios
    // Suscribirse a cambios y convertir a mayúsculas
    this.service_name?.valueChanges.subscribe(value => {
      if (value) {
        this.service_name?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });
    this.functionDataCurrent = this.dataInitial.bind(this); //replica la funcion
    this.functionDataCurrent(this.pageSize);
  }

  async selectCategory() {
    if (!this.service_type.value) {
      this.selectedCategory = false;
      this.filteredServices = [];
      this.listServicesSelected = [];
      this.serviceForm.get('idService')?.setValue('')
      this.serviceForm.get('service_name')?.setValue('')
      return;
    }
    this.serviceForm.get('service_name')?.setValue('')
    this.selectedCategory = true;
    await this.cargarServicios();
  }

  onServicesChange(event: any) {
    const selectedIds: string[] = event.value;
    const idsCategoriaActual = new Set(this.allItems1.map(s => s.id));

    // Crear la lista de objetos seleccionados en esta categoría
    const selectedObjects = this.allItems1
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ id: s.id, name: s.name }));

    // Mantener los servicios seleccionados de otras categorías
    const filteredPrev = this.listServicesSelected.filter(
      item => !idsCategoriaActual.has(item.id)
    );

    // Unir y eliminar duplicados
    this.listServicesSelected = [...filteredPrev, ...selectedObjects].filter(
      (item, index, self) => index === self.findIndex(t => t.id === item.id)
    );

    // Actualizar el control 'idService' con los IDs seleccionados
    this.serviceForm.get('idService')?.setValue(this.listServicesSelected.map(s => s.id));
  }

  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  async cargarServicios(): Promise<void> {
    try {
      this.spinner.spinnerOnOff();
      const allItems = await lastValueFrom(
        this.loadAllServices().pipe(
          filter((items: any) => items.length > 0),
          finalize(() => this.spinner.spinnerOnOff())
        )
      );
      this.filteredServices = allItems;
      this.allItems1 = allItems;
      this.serviceFilter = '';
      this.filterServices();
    } catch (error) {
      console.error("❌ Error al cargar servicios:", error);
      this.filteredServices = [];
      this.mytoastr.showError('', 'No tiene Servicios')
    }
  }

  loadAllServices() {
    return this.services.getServicesFromCategory(this.service_type.value).pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.services.getServicesFromCategory(this.service_type.value, response.data.nextPageKey)
          : EMPTY // ✅ Termina el flujo cuando no hay más páginas
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc, items) => acc.concat(items), []),
      startWith([])
    );
  }

  getCollectionMode(indicators) {
    const parsed = typeof indicators === "string" ? JSON.parse(indicators) : indicators;
    let payBill = false, payOnline = false;

    for (let i = 0, len = parsed.length; i < len; i++) {
      const item = parsed[i];

      if (item.id === "PAY_BILL") {
        payBill = item.isActive;
        if (!payBill) return "DATA ENTRY";
      } else if (item.id === "PAY_ONLINE") payOnline = item.isActive;

      if (payBill && payOnline) return "PAGO INTERCONECTADO";
    }
    return payBill ? "BASE DE DATOS" : "DATA ENTRY";
  };

  dataInitial(pageSize: any) {
    const input = this.service_name.value?.toUpperCase();
    const inputId = this.service_id.value?.toUpperCase();
    const provider = this.provider.value?.toUpperCase();
    const inputType = this.service_type.value?.toUpperCase();
    const inputStatus = this.status.value?.master_name?.toUpperCase();
    const listIds = this.servicesId;
    this.spinner.spinnerOnOff();
    // return
    console.log("pag key:");
    console.log(this.pageKey);
    this.services.getServices(input, inputStatus, inputType, null, this.count, null, pageSize, this.pageKey, undefined, inputId, provider, listIds).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter

        this.dataService = this.dataFilter.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || '',
          collectorMode: item.indicators ? this.getCollectionMode(item.indicators) : '',
        }));
        console.log("data.data.nextPageKey:");
        console.log(data.data.nextPageKey);
        console.log("this.count:");
        console.log(this.count);
        console.log("data.data.Count:");
        console.log(data.data.Count);
        if (this.dataService.length == this.count) {//se recuperaron todos los datos
          this.pageKey = null;
        } else {
          this.pageKey = data.data.nextPageKey ?? null;
        }
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
      idService: [''],
      service_type: [''],
      service_id: [''],
      provider: [''],
      status: ['']
    })
  }

  addService() {
    this.router.navigate(['service/add'])
  }

  updateService() {
    this.router.navigate(['service/import', 'update']);
  }

  createService() {
    this.router.navigate(['service/import', 'create']);
  }

  searchData() {
    if (!this.service_name.value && !this.status.value && !this.service_type.value && !this.service_id.value && !this.provider.value) {
      this.mytoastr.showWarning('Ingrese un valor válido', '')
      return
    }
    this.clearData();
    this.dataInitial(this.pageSize);
  }

  cleanSearch() {
    this.service_name.setValue('')
    this.close = false;
    this.serviceFilter = '';
    this.filteredServices = [];
    this.listServicesSelected = [];
    this.allItems = [];
    this.listServicesSelected = [];
    this.clearData();
  }

  clickButton(event) {
    console.log("event", event)
    const { value, element } = event
    if (value == "edit") {
      console.log("element: ", element)
      this.editElement(element.id)
    }
    if (value == "config_service") {
      console.log("element: ", element)
      this.openDialogConfigService(element)
    }else if(value == "config_service_plus") {
      console.log("element: ", element)
      this.editAdvancedElement(element.id);
    }
  }

  openDialogConfigService(element) {

    const dialogRef = this.dialog.open(DialogServiceConfigComponent, {

      width: '600px',
      data: {
        serviceName: element.name,
        serviceId: element.id,
        serviceAmountTransactionRestriccion: element.amountTransactionRestriccion,
        serviceAmountDailyRestriccion: element.amountDailyRestriccion,
        servicepay_multiple: element.pay_multiple,
        servicemax_concept_pay: element.max_concept_pay,
        servicepay_latest: element.pay_latest,
      }
    });

    dialogRef.afterClosed().subscribe(
      response => {
        if (response) {
          console.log('result en afterClosed of openDialogMinBalance', response)
          this.reload();
        }
      });



  }
  
  editElement(id: any) {
    this.router.navigate([`/service/edit/${id}`]);
  }
  editAdvancedElement(id: any) {
    this.router.navigate([`/service/advanced/${id}`]);
  }

  dataMaster() {
    this.master.getItemsMasterTable('1').subscribe({
      next: (data) => {
        this.stateMaster = data;
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.master.getItemsMasterTable('14'), // CategoriaService
      this.personService.getPerson('PROVEEDOR'),
    ]).subscribe({
      next: (response) => {
        const [categoryService, providers] = response;
        this.categoriesService = categoryService;
        this.listProviders = providers.data;
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

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataService = [];
    this.dataFilter = [];
    this.allItems = [];
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.dataInitial(this.pageSize);
  }

  /************************************* METODOS DE BOTONES ***********************************/
  clearFormAndData() {
    this.clearData();
    this.cleanSearch();
    this.serviceForm.reset();
    this.selectedCategory = false;
    this.listServicesSelected = [];
    this.dataInitial(this.pageSize);
  }


  /******************************** METODOS DE PAGINADO *************************************/
  onPageChange(event: PageEvent) {
    console.log('onPageChange', event);
    console.log('pageKey', this.pageKey);
    console.log('pageSize', this.pageSize);
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      name: this.service_name.value?.toUpperCase() || undefined,
      type: this.service_type.value?.toUpperCase() || undefined,
      status: this.status.value?.master_name?.toUpperCase() || undefined,
      service_id: this.service_id.value?.toUpperCase() || undefined,
      provider: this.provider.value?.toUpperCase() || undefined,
    };

    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });
    const inbx = 'srv';
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

  /******************************************** METODOS GET ****************************************/

  get service_name() {
    return this.serviceForm.get('service_name')
  }

  get service_type() {
    return this.serviceForm?.get('service_type')
  }

  get status() {
    return this.serviceForm.get('status')
  }

  get service_id() {
    return this.serviceForm.get('service_id')
  }

  get provider() {
    return this.serviceForm.get('provider')
  }

  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
  }

  get servicesId(): string {
    return this.listServicesSelected.map(s => s.id).join(', ');
  }

}

interface ServiceItem {
  id: string;
  name: string;
}
