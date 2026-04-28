import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PageEvent } from '@angular/material/paginator';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { forkJoin } from 'rxjs';
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
    { 'name': 'Proveedor', 'attribute': 'nameProvider' },
    { 'name': 'Cliente', 'attribute': 'nameClient' },
    { 'name': 'Estado', 'attribute': 'status', 'config': { 'styleClass': true } },
    {
      'name': 'Acciones',
      'attribute': '',
      'config': {
        'type': 'buttonicons',
        restriccPermission: true,
        actions: [{ hide: false, bgClass: 'yellow', toolTip: 'Editar Servicio', icon: 'edit', value: 'edit', permission: "services-updates-individual" }]
      }
    },
  ];

  public pageSize: any = 5;
  public pageKey: any[];
  public close: boolean = false;
  public serviceForm!: FormGroup;
  public dataFilter: any = [];
  public dataService: any[];
  public functionDataCurrent: (pageSize: any) => any;
  public stateMaster: any;
  public categoriesService: any[] = [];
  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public listServicesSelected: ServiceItem[] = [];
  public allItems: any[] = [];
  public serviceFilter: string = '';

  private readonly pagUtils: PaginationUtils | undefined;
  public count: number = null; // Variable para el total de elementos
  public listProviders: any;
  public selectedCategory: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;


  constructor(
    private readonly router: Router,
    private readonly services: ServicesService,
    private readonly fb: FormBuilder,
    private readonly master: MasterService,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
    private readonly personService: PersonService,
    public authService: AuthService,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formService();
    this.dataMaster();
    this.listData();
    this.service_name?.valueChanges.subscribe(value => { if (value) this.service_name?.setValue(value.toUpperCase(), { emitEvent: false }); });
    this.functionDataCurrent = this.dataInitial.bind(this);
    this.functionDataCurrent(this.pageSize);
  }

  dataInitial(pageSize: any) {
    const input = this.service_name.value?.toUpperCase();
    const inputId = this.service_id.value?.toUpperCase();
    const provider = this.provider.value?.toUpperCase();
    const inputType = this.service_type.value?.toUpperCase();
    const inputStatus = this.status.value?.master_name?.toUpperCase();
    const listIds = this.servicesId;
    this.spinner.spinnerOnOff();
    console.log("pag key:");
    console.log(this.pageKey);
    this.services.getServices(input, inputStatus, inputType, null, this.count, null, pageSize, this.pageKey, undefined, inputId, provider, listIds).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        this.dataFilter = [...this.dataFilter, ...data.data.Items];
        this.dataService = this.dataFilter.map(item => ({ ...item, serviceTypeName: item.serviceType?.name || '' }));
        if (this.dataService.length == this.count) this.pageKey = null;
        else this.pageKey = data.data.nextPageKey ?? null;

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

  addService() { this.router.navigate(['service/add']) }

  updateService() { this.router.navigate(['service/import', 'update']); }

  createService() { this.router.navigate(['service/import', 'create']); }

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

  clickButton({ value, element }: { value: string, element: { id: string } }) {
    if (value == "edit") this.editElement(element.id)
  }

  editElement(id: string) { this.router.navigate([`/service/edit/${id}`]); }

  dataMaster() {
    this.master.getItemsMasterTable('1').subscribe({
      next: (data) => { this.stateMaster = data; },
      error: (error) => { console.error('Error:', error); },
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
      complete: () => { this.spinner.spinnerOnOff(); },
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
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    this.spinner.spinnerOnOff();
    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      name: this.service_name.value?.toUpperCase() || undefined,
      type: this.service_type.value?.toUpperCase() || undefined,
      status: this.status.value?.master_name?.toUpperCase() || undefined,
      service_id: this.service_id.value?.toUpperCase() || undefined,
    };

    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => { if (exportFilters[key] === undefined) delete exportFilters[key]; });
    const inbx = 'srv';
    const token = localStorage.getItem('fcmToken');
    this.services.exportServices(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) this.mytoastr.showWarning('', 'Procesando Archivo...')
        else this.mytoastr.showError('', 'Error al enviar la solicitud')
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error durante la exportación:', error);
        this.mytoastr.showError('Error durante la exportación', '');
      }
    });
  }

  /******************************************** METODOS GET ****************************************/
  get service_name() { return this.serviceForm.get('service_name') }
  get service_type() { return this.serviceForm?.get('service_type') }
  get status() { return this.serviceForm.get('status') }
  get service_id() { return this.serviceForm.get('service_id') }
  get provider() { return this.serviceForm.get('provider') }
  get servicesNames(): string { return this.listServicesSelected.map(s => s.name).join(', ') }
  get servicesId(): string { return this.listServicesSelected.map(s => s.id).join(', ') }
}

interface ServiceItem {
  id: string;
  name: string;
}
