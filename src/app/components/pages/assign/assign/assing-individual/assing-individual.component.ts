import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
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
import { environment } from 'src/environments/environment';

@Component({
  selector: 'uni-assing-individual',
  templateUrl: './assing-individual.component.html',
  styleUrls: ['./assing-individual.component.scss']
})
export class AssingIndividualComponent implements OnInit {

  public formAssign!: FormGroup<any>;


  public categoriesService: MasterInterface[] = [];//Categorias de los servicios
  public persons: any[] = [];
  public typeComission: MasterInterface[] = [];
  public columns: any[] = [
    { 'name': 'Nombre Alias', 'attribute': 'nameAlias' },
    { 'name': 'Tipo Documento', 'attribute': 'typeDoc' },
    { 'name': 'Tipo Entidad', 'attribute': 'typeService' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];

  public data: any;

  //Variables para la tabla 
  public dataServiceTable: ServiceTableInterface[] = []; // Datos de la tabla de servicios
  public dataTableFilter: ServiceTableInterface[] = []; // Datos filtrados de servicios(acumulados)
  public count: number = null; // Variable para el total de elementos
  public pageSize: any = 5;
  public pageKey: any[];
  private readonly pagUtils: PaginationUtils = new PaginationUtils();
  public functionDataCurrent: (pageSize: any) => any;
  @ViewChild(DynamicTableComponent) dynamicTable!: DynamicTableComponent;
  public columnsTableService: any[] = [
    { 'name': 'NUM', 'attribute': 'index' },
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Tipo Comisión', 'attribute': 'typeComission' },

    { 'name': 'Proveedor', 'attribute': 'nameProvider' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];
  public dataServiceSelected: ServiceTableInterface = null;//Información del servicio seleccionado
  public dataServiceSelectedIds: string[] = []; // IDs de los servicios seleccionados(solo deberia ser 1)
  //------------------------
  public disableEntities = false;
  public disableAll = false;

  public isQrAssign = false

  public comissionFixed = false
  public comissionRange = false
  public comissionPercentage = false
  public comissionCriterio = false

  constructor(
    private readonly serviceServ: ServicesService,
    private readonly masterService: MasterService,
    private readonly personService: PersonService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
    private readonly cookies: CookieService
  ) { }

  /****************************************** METODOS INICIALES **********************************************/

  ngOnInit(): void {
    this.isQrAssign = this.router.url === "/generateqr/assign";
    this.listData();
    this.initialForm();
    this.functionDataCurrent = this.searchService.bind(this);
    this.functionDataCurrent(this.pageSize);
  }

  initialForm() {
    this.formAssign = this.fb.group({
      categoryService: [''],
      service: [''],
      entity: [''],
      comission: ['', Validators.required],
      fixed: [''],
      porcent: [''],
      multiple: [''],
      range_lower: [''],
      range_upper: [''],
    });
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('15'), // tipoComission
      this.personService.getPerson(this.isQrAssign ? 'USER QRCASH' : 'RECAUDADORA DE SERVICIOS', undefined, true),
      this.masterService.getItemsMasterTable('14') // CategoriaService
    ]).subscribe({
      next: (response) => {
        const [typeComission, person, categoryService] = response;
        this.typeComission = typeComission;
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


  selectionComissionProv(event: any) {
    if (this.formAssign.get('fixed')) {
      this.formAssign.removeControl('fixed');
    }
    if (this.formAssign.get('multiple')) {
      this.formAssign.removeControl('multiple');
    }
    if (this.formAssign.get('porcent')) {
      this.formAssign.removeControl('porcent');
    }
    if (this.formAssign.get('range_lower')) {
      this.formAssign.removeControl('range_lower');
    }
    if (this.formAssign.get('range_upper')) {
      this.formAssign.removeControl('range_upper');
    }

    switch (event.value) {
      case 'FIJO':
        this.formAssign.addControl('fixed', this.fb.control('', Validators.required));
        this.comissionPercentage = false;
        this.comissionCriterio = false;
        this.comissionFixed = true;
        this.comissionRange = false;
        break
        ;
      case 'PORCENTUAL':
        this.formAssign.addControl('porcent', this.fb.control('', Validators.required));
        this.comissionFixed = false;
        this.comissionCriterio = false;
        this.comissionPercentage = true;
        this.comissionRange = false;

        break
        ;
      case 'MULTIPLE':
        this.formAssign.addControl('fixed', this.fb.control('', Validators.required));
        this.formAssign.addControl('multiple', this.fb.control('', Validators.required));
        this.formAssign.addControl('porcent', this.fb.control('', Validators.required));
        this.comissionCriterio = true;
        this.comissionFixed = true;
        this.comissionPercentage = true;
        this.comissionRange = false;
        break
        ;
      case 'RANGO':
        this.formAssign.addControl('multiple', this.fb.control('', Validators.required));
        this.formAssign.addControl('range_lower', this.fb.control('', Validators.required));
        this.formAssign.addControl('range_upper', this.fb.control('', Validators.required));
        this.comissionCriterio = true;
        this.comissionPercentage = false;
        this.comissionFixed = false;
        this.comissionRange = true;
        break;
    };

  }

  /******************************************** METODOS PARA LOS BOTONES ******************************************/

  registerServiceQrAssign() {
    this.spinner.spinnerOnOff();
    let dataRegister = this.data.map(value => ({
      ID_PROVIDER: '00000100',// ID ´PROVEEDOR
      ID_CLIENT: value.idPerson, //ID DE RECAUDADORA
      ID_SERVICE_PROV: this.dataServiceSelected.id_serviceProv, //id de convenio
      PROV_ORIGIN: this.dataServiceSelected.idProvider,//codigo proveedor origen
      ID_SERVICE: this.dataServiceSelected.id, //id del servicio
      SERVICE_NAME: this.dataServiceSelected.name, //nnomb de servicio
      USER_REG: this.cookies.get('person_id') || 'desconocido',
      ID_TYPE_SERVICE: this.dataServiceSelected.serviceType.id,
      TYPE_SERVICE: this.dataServiceSelected.serviceType.name,//master
      SERVICE_CATEGORY: this.dataServiceSelected.serviceType.name,//master
      BUSINESS: this.dataServiceSelected.business, //nombre de negocio
      STATUS: this.dataServiceSelected.status,
      ZONE: 'MULTIDEPARTAMENTAL',
      DATE: new Date().toISOString(),
      PREFIX: "SERVICE"
    }))

    console.log("dataRegister: ", dataRegister)


    this.serviceServ.registerServiceQrAssign(dataRegister).subscribe({
      next: (response) => {
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('Error : Algunos servicios ya fueron asignados', '')
          return
        }
        if (response.statusCode == 400) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('No se asignó ningún ítem o ya fueron asignados anteriormente', '')
          return
        }
        if (response.statusCode == 200) {
          this.mytoastr.showSuccess('Todos los Servicios asignados con éxito', '')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        this.clearRegister();
        this.spinner.spinnerOnOff();

      }
    })
  }

  searchService(pageSize: any) {
    this.spinner.spinnerOnOff();
    //Obtenemos los servicios que se encuentran habilitados
    this.serviceServ.getServices(this.service.value, 'HABILITADO', null, this.categoryService.value?.master_name, this.count, this.isQrAssign ? environment.URL_API_SERVICES_IDCLIENT : "00000100", pageSize, this.pageKey).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '');
          return
        }
        this.dataTableFilter = [...this.dataTableFilter, ...data.data.Items]; // Acumula los datos en dataTableFilter
        this.dataServiceTable = this.dataTableFilter.map((item, index) => ({
          ...item,
          index: index + 1, // Añadir un índice para la tabla
          serviceTypeName: item.serviceType?.name || ''
        }));
        this.pageKey = data.data.nextPageKey ?? null;
        this.count = data.data.Count ?? 0;
      },
      error: (err) => {
        console.log(err);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.dataServiceSelected = null;//Limpiar el servicio seleccionado
        this.dataServiceSelectedIds = []; // Limpiar los IDs seleccionados
        this.dynamicTable.clearSelection(); // Limpiar la selección de la tabla dinámica
        this.spinner.spinnerOnOff();
      }
    })
  }

  onServiceInput(event: any) {
    const inputValue = event.target.value.toUpperCase();
    this.service.setValue(inputValue);
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

  registerServiceAssign() {
    if (!this.dataServiceSelectedIds || this.dataServiceSelectedIds.length === 0) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar un servicio para asignar.');
      return;
    }
    if (this.dataServiceSelectedIds.length > 1) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar un solo servicio para asignar.');
      return;
    }
    let dataRegister = this.data.map(value => ({
      idProvider: '00000100',// ID ´PROVEEDOR
      idClient: value.idPerson, //ID DE RECAUDADORA
      idServiceProv: this.dataServiceSelected.id_serviceProv, //id de convenio
      codProveedor: this.dataServiceSelected.idProvider,//codigo proveedor origen
      idService: this.dataServiceSelected.id, //id del servicio
      serviceName: this.dataServiceSelected.name, //nnomb de servicio
      userRegistration: this.cookies.get('person_id') || 'desconocido',
      idTypeService: this.dataServiceSelected.serviceType.id,
      typeService: this.dataServiceSelected.serviceType.name,//master
      business: this.dataServiceSelected.business, //nombre de negocio
      status: this.dataServiceSelected.status,
      zone: 'MULTIDEPARTAMENTAL',
      collectorName: "",//vacio cuando son clientes // somos proveedores
      indicators: this.dataServiceSelected.indicators,
      additionalPaymentFields: this.dataServiceSelected.additional,
      ...this.getComission(),
    }))
    this.registerServiceRequest(dataRegister)
  }

  getComission() {
    switch (this.comission.value) {
      case 'FIJO':
        return {
          ownFixedComission: this.fixed.value ?? 0, //numeber
          ownComissionType: this.comission.value,
        }
      case 'PORCENTUAL':
        return {
          ownPCTComission: this.porcent.value ?? 0, //number
          ownComissionType: this.comission.value,
        }
      case 'MULTIPLE':
        return {
          ownFixedComission: this.fixed.value ?? 0, //numeber
          ownCriterionComission: this.multiple.value ?? 0, //number
          ownPCTComission: this.porcent.value ?? 0, //number
          ownComissionType: this.comission.value,
        }
      case 'RANGO':
        return {
          ownCriterionComission: this.multiple.value ?? 0, //number
          ownComissionType: this.comission.value,
          ownComissionRange: this.range_lower.value && this.range_upper.value ? JSON.stringify({ lower: this.range_lower.value, upper: this.range_upper.value }) : '', //string
        }
    }
    return {

    }
  }

  onCancel() {
    this.router.navigate(['../assign']);
  }


  /************************************* METODOS PARA LOS INPUTS *******************************************/

  selectEntity(event: any) {
    if (event.value == 'TODOS') {
      this.disableEntities = true
      this.getRecaudador();
    } else {
      this.disableEntities = false
      this.disableAll = true
      this.listEntitySelect(event.value);
    }
    if (event.value.length === 0) {
      this.disableAll = false;
    }
  }

  validComission(event: any, controlName: string): void {//Validamos que la comisión fija de la asignación, sea menor a la comisión fija del servicio
    console.log("validComission ", this.dataServiceSelected)
    if (!this.dataServiceSelected) {
      this.mytoastr.showWarning('Selecciona un servicio', '');
      this.fixed?.setValue('');
      this.range_lower?.setValue('');
      this.range_upper?.setValue('');
      this.porcent?.setValue('');
      this.multiple?.setValue('');
      return;
    }
    switch (controlName) {
      case 'fixed':
        if (this.fixed.value < 0) {
          this.fixed.setValue('');
        }
        if (this.dataServiceSelected && this.dataServiceSelected.fixedcomission != null && this.fixed.value > this.dataServiceSelected.fixedcomission) {
          this.fixed.setValue('');
          this.mytoastr.showWarning('La comisión fija no puede ser mayor a la comisión fija del servicio', '');
        }

        if (this.dataServiceSelected.rangecomission) {
          const { lower } = JSON.parse(this.dataServiceSelected.rangecomission);
          if (this.fixed.value > lower) {
            this.fixed.setValue('');
            this.mytoastr.showWarning('La comisión fija está fuera del rango permitido', '');
          }
        }
        break;
      case 'range_lower':
        if (this.range_lower.value < 0) {
          this.range_lower.setValue('');
        }
        if (this.dataServiceSelected.fixedcomission != null && this.range_lower.value > this.dataServiceSelected.fixedcomission) {
          this.range_lower.setValue('');
          this.mytoastr.showWarning('La comisión menor al criterio no puede ser mayor a la comisión fija del servicio', '');
        }
        if (this.dataServiceSelected.rangecomission) {
          const { lower } = JSON.parse(this.dataServiceSelected.rangecomission);
          if (this.range_lower.value > lower) {
            this.range_lower.setValue('');
            this.mytoastr.showWarning('La comisión menor al criterio está fuera del rango permitido', '');
          }
        }
        break;
      case 'range_upper':
        if (this.range_upper.value < 0) {
          this.range_upper.setValue('');
        }
        if (this.dataServiceSelected.fixedcomission != null && this.range_upper.value > this.dataServiceSelected.fixedcomission) {
          this.range_upper.setValue('');
          this.mytoastr.showWarning('La comisión mayor al criterio no puede ser mayor a la comisión fija del servicio', '');
          return;
        }
        if (this.dataServiceSelected.rangecomission) {
          const { upper } = JSON.parse(this.dataServiceSelected.rangecomission);
          if (this.range_upper.value > upper) {
            this.range_upper.setValue('');
            this.mytoastr.showWarning('La comisión mayor al criterio está fuera del rango permitido', '');
          }
        }
        break;
      case 'porcent':
        if (this.porcent.value < 0) {
          this.porcent.setValue('');
        }
        if (this.dataServiceSelected && this.dataServiceSelected.pctcomission != null && this.porcent.value > this.dataServiceSelected.pctcomission) {
          this.porcent.setValue('');
          this.mytoastr.showWarning('La comisión porcentual no puede ser mayor a la comisión porcentual del servicio', '');
        }
        break;
      default:
        break;
    }
  }

  /*********************************************** METODOS PARA EL PAGINADO Y OTROS *****************************************/
  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  handleSelectedIds(selectedIds: string[]) {
    this.dataServiceSelectedIds = selectedIds; // Asignar los IDs seleccionados a dataServiceSelectedIds
    console.log("DATA SERVICES SELECTED IDS: ", this.dataServiceSelectedIds)
  }

  selectedHandle(event: any) {
    if (event && event.length > 0) {//Verificar si hay almenos uno seleccionado, sino limpiamos la seleccion
      if (this.dataServiceSelected) {
        this.dataServiceSelected = null;
      }
      this.dataServiceSelected = event[0];
      console.log("this.dataServiceSelected ", this.dataServiceSelected)
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
    this.personService.getPerson(this.isQrAssign ? "USER QRCASH" : 'RECAUDADORA DE SERVICIOS', undefined, true).subscribe({
      next: (response) => {
        this.data = this.convertData(response.data)
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.log("error", error);
      },
      complete: () => {
        console.log("complete");
        this.spinner.spinnerOnOff();
      }
    })
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
      id_serviceProv: value.id_serviceProv
    }))
  }

  registerServiceRequest(data: any) {

    this.spinner.spinnerOnOff();
    this.serviceServ.registerServiceAssign(data).subscribe({
      next: (response) => {
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('Error : Algunos servicios ya fueron asignados', '')
          return
        }
        if (response.statusCode == 400) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('No se asignó ningún ítem o ya fueron asignados anteriormente', '')
          return
        }
        if (response.statusCode == 200) {
          this.mytoastr.showSuccess('Servicio asignado con éxito', '')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        this.clearRegister();
        //this.router.navigate(['../assign/list'])
        this.spinner.spinnerOnOff();

      }
    })
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
  get categoryService() { return this.formAssign.get('categoryService') };
  get service() { return this.formAssign.get('service') };
  get entity() { return this.formAssign.get('entity') };
  get fixed() { return this.formAssign.get('fixed') };
  get range_lower() { return this.formAssign.get('range_lower') };
  get range_upper() { return this.formAssign.get('range_upper') };
  get comission() { return this.formAssign.get('comission') };
  get multiple() { return this.formAssign.get('multiple') };
  get porcent() { return this.formAssign.get('porcent') };

}
