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
import { expand, filter, forkJoin, EMPTY, scan, startWith, lastValueFrom, finalize, map } from 'rxjs';

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
  public categoriesService: any[] = [];
  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];
  public allItems1: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';

  private pagUtils: PaginationUtils | undefined;
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos
  public listProviders: any;
  public selectedCategory: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;


  constructor(
    private router: Router,
    private services: ServicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private master: MasterService,
    private person: PersonService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private personService: PersonService
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
    this.spinner.spinnerOnOff
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
        //this.dataService = [...this.dataService, ...data.data.Items]; // Acumula los datos en dataFilter
        //console.log(...data.data.Items);
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter

        this.dataService = this.dataFilter.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || ''
        }));
        //console.log("this.dataFilter: "+this.dataFilter);
        //console.log("this.dataService: "+this.dataService);
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

  selectedHandle(event: any) {
    console.log('event', event);
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

  getIdService(idService) {
    console.log('idService', idService);
    this.services.getIdServices(idService).subscribe({
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
    this.allItems = [];
  }

  reload() {
    this.clearData();
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
    });
  }

  asignationService() {
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
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
