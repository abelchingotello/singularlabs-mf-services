import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { forkJoin } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { MasterInterface } from 'src/app/interfaces/masterInterface';
import { ServiceTableInterface } from 'src/app/interfaces/serviceTableInterface';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';

@Component({
  selector: 'uni-assing-individual',
  templateUrl: './assing-individual.component.html',
  styleUrls: ['./assing-individual.component.scss'],
})
export class AssingIndividualComponent implements OnInit {
  public formAssign!: FormGroup<any>;

  public categoriesService: MasterInterface[] = []; //Categorias de los servicios
  public persons: any[] = [];
  public typeComission: MasterInterface[] = [];
  public columns: any[] = [
    { name: 'Nombre Alias', attribute: 'nameAlias' },
    { name: 'Tipo Documento', attribute: 'typeDoc' },
    { name: 'Tipo Entidad', attribute: 'typeService' },
    {
      name: 'Estado',
      attribute: 'status',
      config: {
        styleClass: true,
      },
    },
  ];

  public data: any;

  //Variables para la tabla
  public dataServiceTable: ServiceTableInterface[] = []; // Datos de la tabla de servicios
  public dataTableFilter: ServiceTableInterface[] = []; // Datos filtrados de servicios(acumulados)
  public count: number = null; // Variable para el total de elementos
  public pageSize: any = 5;
  public pageKey: any[];
  private pagUtils: PaginationUtils = new PaginationUtils();
  public functionDataCurrent: (pageSize: any) => any;
  @ViewChild(DynamicTableComponent) dynamicTable!: DynamicTableComponent;
  public columnsTableService: any[] = [
    { name: 'NUM', attribute: 'index' },
    { name: 'Nombre', attribute: 'name' },
    { name: 'Proveedor', attribute: 'nameProvider' },
    {
      name: 'Estado',
      attribute: 'status',
      config: {
        styleClass: true,
      },
    },
  ];
  public dataServiceSelected: ServiceTableInterface = null; //Información del servicio seleccionado
  public dataServiceSelectedIds: string[] = []; // IDs de los servicios seleccionados(solo deberia ser 1)
  //------------------------
  public disableEntities = false;
  public disableAll = false;
  public returnUrl: String;

  constructor(
    private serviceServ: ServicesService,
    private masterService: MasterService,
    private personService: PersonService,
    private fb: FormBuilder,
    private router: Router,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private cookies: CookieService,
    private route: ActivatedRoute,
  ) {}

  /****************************************** METODOS INICIALES **********************************************/

  ngOnInit(): void {
    this.listData();
    this.initialForm();
    this.functionDataCurrent = this.searchService.bind(this);
    this.functionDataCurrent(this.pageSize);
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/assign';
    });
  }

  onUppercaseInput(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    const uppercasedValue = inputElement.value.toUpperCase();
    this.formAssign
      .get(controlName)
      ?.setValue(uppercasedValue, { emitEvent: false });
  }

  initialForm() {
    this.formAssign = this.fb.group({
      categoryService: [''],
      service: [''],
      entity: [''],
      comission: ['FIJO', Validators.required],
      fixed: [''],
      porcent: [''],
      multiple: [''],
    });
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('15'), // tipoComission
      this.personService.getPerson('RECAUDADORA DE SERVICIOS', undefined, true),
      this.masterService.getItemsMasterTable('14'), // CategoriaService
    ]).subscribe({
      next: (response) => {
        const [typeComission, person, categoryService] = response;
        this.typeComission = typeComission;
        this.persons = person.data;
        this.categoriesService = categoryService;
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error loading master table data:', error);
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      },
    });
  }

  /******************************************** METODOS PARA LOS BOTONES ******************************************/

  searchService(pageSize: any) {
    this.spinner.spinnerOnOff();
    //Obtenemos los servicios que se encuentran habilitados
    this.serviceServ
      .getServices(
        this.service.value,
        'HABILITADO',
        null,
        this.categoryService.value?.master_name,
        this.count,
        pageSize,
        this.pageKey,
      )
      .subscribe({
        next: (data) => {
          if (data.statusCode == 201) {
            this.mytoastr.showWarning(data.messages, '');
            return;
          }
          this.dataTableFilter = [...this.dataTableFilter, ...data.data.Items]; // Acumula los datos en dataTableFilter
          this.dataServiceTable = this.dataTableFilter.map((item, index) => ({
            ...item,
            index: index + 1, // Añadir un índice para la tabla
            serviceTypeName: item.serviceType?.name || '',
          }));
          this.pageKey = data.data.nextPageKey ?? null;
          this.count = data.data.Count ?? 0;
        },
        error: (err) => {
          console.log(err);
          this.spinner.spinnerOnOff();
        },
        complete: () => {
          this.dataServiceSelected = null; //Limpiar el servicio seleccionado
          this.dataServiceSelectedIds = []; // Limpiar los IDs seleccionados
          this.dynamicTable.clearSelection(); // Limpiar la selección de la tabla dinámica
          this.spinner.spinnerOnOff();
        },
      });
  }

  clearFormAndData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataServiceTable = [];
    this.dataTableFilter = [];
    this.categoryService.setValue('');
    this.service.setValue('');
    this.searchService(this.pageSize);
  }

  searchBtn() {
    this.count = null;
    this.pageKey = undefined;
    this.dataServiceTable = [];
    this.dataTableFilter = [];
    this.dynamicTable.clearSelection(); // Limpiar la selección de la tabla dinámica(y ids)
    this.searchService(this.pageSize);
  }

  // De una persona a varios servicios
  registerServiceAssign() {
    //Comprobar si existe al menos un servicio seleccionado
    if (
      !this.dataServiceSelectedIds ||
      this.dataServiceSelectedIds.length === 0
    ) {
      this.mytoastr.showWarning(
        'Error',
        'Debe seleccionar un servicio para asignar.',
      );
      return;
    }
    // Comprobar si existe un solo servicio seleccionado
    if (this.dataServiceSelectedIds.length > 1) {
      this.mytoastr.showWarning(
        'Error',
        'Debe seleccionar un solo servicio para asignar.',
      );
      return;
    }
    //Si pasa a esta parte es pq existe un solo servicio seleccionado(dataServiceSelected)

    //Limpiar cuando se cambie de tipo de comisión
    let dataRegister = this.data.map((value) => ({
      idProvider: '00000100', // ID ´PROVEEDOR
      idClient: value.idPerson, //ID DE RECAUDADORA
      idServiceProv: this.dataServiceSelected.id_serviceProv, //id de convenio
      codProveedor: this.dataServiceSelected.idProvider, //codigo proveedor origen
      idService: this.dataServiceSelected.id, //id del servicio
      serviceName: this.dataServiceSelected.name, //nnomb de servicio
      userRegistration: this.cookies.get('person_id') || 'desconocido',
      idTypeService: this.dataServiceSelected.serviceType.id,
      typeService: this.dataServiceSelected.serviceType.name, //master
      business: this.dataServiceSelected.business, //nombre de negocio
      status: this.dataServiceSelected.status,
      zone: 'MULTIDEPARTAMENTAL',
      collectorName: '', //vacio cuando son clientes // somos proveedores
      ownFixedComission: this.fixed.value ?? 0, //numeber
      ownCriterionComission: this.multiple ?? 0, //number
      ownPCTComission: this.porcent ?? 0, //number
      ownComissionType: this.comission.value,
      indicators: this.dataServiceSelected.indicators,
      additionalPaymentFields: this.dataServiceSelected.additional,
      comissionFixed:
        this.dataServiceSelected.fixedcomission - this.fixed.value, //number
      comissionPCT: this.dataServiceSelected.pctcomission - this.porcent, //number
    }));
    this.registerServiceRequest(dataRegister);
  }

  onCancel() {
    this.router.navigate([`../${this.returnUrl}`]);
  }

  /************************************* METODOS PARA LOS INPUTS *******************************************/

  selectEntity(event: any) {
    if (event.value == 'TODOS') {
      this.disableEntities = true;
      this.getRecaudador();
    } else {
      this.disableEntities = false;
      this.disableAll = true;
      this.listEntitySelect(event.value);
    }
    if (event.value.length === 0) {
      this.disableAll = false;
    }
  }

  validComissionFixed(): void {
    //Validamos que la comisión fija de la asignación, sea menor a la comisión fija del servicio
    if (this.dataServiceSelected?.fixedcomission && this.fixed.value) {
      if (Number(this.fixed.value) > this.dataServiceSelected.fixedcomission) {
        this.mytoastr.showWarning(
          'La comisión fija debe ser menor que la comisión fija del servicio: ',
          this.dataServiceSelected.fixedcomission.toString(),
        );
        this.fixed.setValue('');
      }
    }
  }

  /*********************************************** METODOS PARA EL PAGINADO Y OTROS *****************************************/
  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(
      event.pageSize,
      this.pageSize,
    );
    this.pagUtils?.onPageChange(
      event,
      this.pageSize,
      this.functionDataCurrent.bind(this),
      this.pageKey,
    );
  }

  handleSelectedIds(selectedIds: string[]) {
    this.dataServiceSelectedIds = selectedIds; // Asignar los IDs seleccionados a dataServiceSelectedIds
  }

  selectedHandle(event: any) {
    if (event && event.length > 0) {
      //Verificar si hay almenos uno seleccionado, sino limpiamos la seleccion
      if (this.dataServiceSelected) {
        this.dataServiceSelected = null;
      }
      this.dataServiceSelected = event[0];
    } else {
      this.dataServiceSelected = null;
    }
  }

  reload() {
    this.dynamicTable.clearSelection();
    this.searchService(this.pageSize);
  }

  /****************************************** OTHER METHODS **********************************************/
  getRecaudador() {
    this.spinner.spinnerOnOff();
    this.personService
      .getPerson('RECAUDADORA DE SERVICIOS', undefined, true)
      .subscribe({
        next: (response) => {
          this.data = this.convertData(response.data);
        },
        error: (error) => {
          this.spinner.spinnerOnOff();
          console.log('error', error);
        },
        complete: () => {
          console.log('complete');
          this.spinner.spinnerOnOff();
        },
      });
  }

  listEntitySelect(list: any[]) {
    this.data = this.convertData(list);
  }

  convertData(data: any[]) {
    return data.map((value) => ({
      nameAlias: value.servicePerson.nameAlias,
      status: value.servicePerson.status,
      typeDoc: value.servicePerson.typeDoc,
      typeService: value.servicePerson.typeService.typeBusiness,
      idPerson: value.servicePerson.idPerson,
      id_serviceProv: value.id_serviceProv,
    }));
  }

  registerServiceRequest(data: any) {
    this.spinner.spinnerOnOff();
    this.serviceServ.registerServiceAssign(data).subscribe({
      next: (response) => {
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning(
            'Error : Algunos servicios ya fueron asignados',
            '',
          );
          return;
        }
        if (response.statusCode == 400) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning(
            'No se asignó ningún ítem o ya fueron asignados anteriormente',
            '',
          );
          return;
        }
        if (response.statusCode == 200) {
          this.mytoastr.showSuccess('Servicio asignado con éxito', '');
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error);
      },
      complete: () => {
        this.clearRegister();
        //this.router.navigate(['../assign/list'])
        this.spinner.spinnerOnOff();
      },
    });
  }

  clearRegister() {
    this.data = [];
    this.service.setValue('');
    this.entity.setValue('');
  }

  /************************************** METODOS PARA VALIDACIONES **************************************************/

  disabledBtnRegister(): boolean {
    return !this.dataServiceSelected || !this.data || this.data.length == 0;
  }

  /***************************************** METODOS GET *************************************************** */
  get categoryService() {
    return this.formAssign.get('categoryService');
  }
  get service() {
    return this.formAssign.get('service');
  }
  get entity() {
    return this.formAssign.get('entity');
  }
  get fixed() {
    return this.formAssign.get('fixed');
  }
  get comission() {
    return this.formAssign.get('comission');
  }
  get multiple() {
    return this.formAssign.get('multiple').value;
  }
  get porcent() {
    return this.formAssign.get('porcent').value;
  }

  isComisionFixed(): boolean {
    return (
      this.comission.value === 'FIJO' || this.comission.value === 'MULTIPLE'
    );
  }
  isComisionMultiple(): boolean {
    return this.comission.value === 'MULTIPLE';
  }
  isComisionPorcent(): boolean {
    return (
      this.comission.value === 'PORCENTUAL' ||
      this.comission.value === 'MULTIPLE'
    );
  }
}
