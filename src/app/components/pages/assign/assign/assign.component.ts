import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { expand, filter, forkJoin, of, reduce, scan, startWith } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ChangeDetectorRef } from '@angular/core';
//
import * as XLSX from 'xlsx';
import { MasterInterface } from 'src/app/interfaces/masterInterface';
import { ServiceTableInterface } from 'src/app/interfaces/serviceTableInterface';
import { PageEvent } from '@angular/material/paginator';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { Router } from '@angular/router';
//

@Component({
  selector: 'uni-assign',
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.scss']
})
export class AssignComponent implements OnInit {

  public formAssign!: FormGroup<any>

  public columns: any[] = [
    { 'name': 'Nombre Alias', 'attribute': 'nameAlias' },
    // { 'name': 'Correo', 'attribute': 'description' },
    // { 'name': 'Zona', 'attribute': 'zone'},
    { 'name': 'Tipo Documento', 'attribute': 'typeDoc' },
    { 'name': 'Tipo Entidad', 'attribute': 'typeService' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];

  public columnsService: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
    { 'name': 'Proveedor', 'attribute': 'idProvider' },
    { 'name': 'Cliente', 'attribute': 'idClient' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];

  public data: any;
  public serviceName: any;

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
    { 'name': 'NUM', 'attribute': 'index' },
    { 'name': 'Nombre', 'attribute': 'name' },
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


  public filteredServices: any[] = []; // Lista filtrada que se mostrará
  public serviceFilter: string = '';
  public typeComission: any[] = [];
  public persons: any[] = [];
  public category: any;
  public disableEntities = false;
  public disableAll = false;
  public comissionFixed: boolean = true;
  public comissionPorcent: boolean = false;
  public comissionMultiple: boolean = false;
  // public dataService: any;

  public oneView: boolean = false;
  public twoView: boolean = false;
  public zeroView: boolean = true;
  public cancel: boolean = false;
  public dataServicesEntity: any;
  public allItems: any;
  public dataRegister: any;
  public disableServiceAll: boolean = false;
  public disableServiceOption: boolean = false;
  public dataRegisterService: any;
  public categoriesService: MasterInterface[] = [];//Categorias de los servicios

  // propiedades para la carga de un archivo excel
  public showExcelUpload: boolean = false;
  public selectedFile: File | null = null;
  public excelData: any[] = [];
  public isProcessingExcel: boolean = false;
  public requiredIdClient: string = '';
  public showIdClientDialog: boolean = false;
  public disableFile: boolean = false;
  //------------------

  constructor(
    private serviceServ: ServicesService,
    private masterService: MasterService,
    private personService: PersonService,
    private fb: FormBuilder,
    private router : Router,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private cookies: CookieService
  ) { }

  ngOnInit(): void {
    this.listData();
    this.initialForm();
    this.functionDataCurrent = this.searchService.bind(this);
    this.functionDataCurrent(this.pageSize);
  }



  //Primero hacer que se registre uno por uno
  //Probar que me traigan los 58 actuales y que se puedan asignar
  //Si funciona, pedir que se suban los 2000 y hacer las mismas pruebas, pero con los 2000
  //No olvidar validar que existan los servicios
  loadAllServices() {  //revisar para que traiga los 2000
    return this.serviceServ.getServicesPageKey(200).pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(200, response.data.nextPageKey)
          : of(null) // Detiene la recursión si no hay más páginas
      ),
      filter(response => response !== null),
      scan((acc, response) => acc.concat(response.data.Items), []),
      startWith([]), // Asegura que siempre haya una emisión inicial
    );
  }

  initExcelUploadState() {
    this.showIdClientDialog = false;
    this.showExcelUpload = false;
    this.selectedFile = null;
    this.excelData = [];
    this.requiredIdClient = '';
    this.isProcessingExcel = false;
    this.data = [];
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
      this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
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

  getRecaudador() {
    this.spinner.spinnerOnOff();
    this.personService.getPerson('RECAUDADORA DE SERVICIOS').subscribe({
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

  selectClient(event) {
    this.requiredIdClient = event.value;
  }

  selectedPerson
  selectAsignService(event) {
    this.selectedPerson = event.value
  }




  selectedServiceAssing(event: any) {
    if (event.value == 'TODOS') {
      this.disableServiceOption = true;
      this.dataServicesEntity = this.allItems;
    } else {
      this.disableServiceOption = false
      this.disableServiceAll = true
      this.dataServicesEntity = this.convertDataService(event.value)
    }

    if (event.value.length === 0) {
      this.disableServiceAll = false;
    }

  }

  listEntitySelect(list: any[]) {
    this.data = this.convertData(list);
  }

  convertDataService(data: any[]) {
    return data.map((value) => ({
      business: value.business,
      description: value.description,
      id: value.id,
      idClient: value.idClient,
      idProvider: value.idProvider,
      name: value.name,
      serviceTypeName: value.serviceType.name,
      serviceTypeId: value.serviceType.id,
      status: value.status,
      indicators: value.indicators,
      additional: value.additional,
      id_serviceProv: value.id_serviceProv
    }))
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


  typeComissionService(event) {
    switch (event.value) {
      case 'FIJO':
        this.comissionFixed = true;
        this.comissionMultiple = false;
        this.comissionPorcent = false
        break;
      case 'MULTIPLE':
        this.comissionFixed = true;
        this.comissionMultiple = true;
        this.comissionPorcent = true;
        break;
      case 'PORCENTUAL':
        this.comissionFixed = false; //revisar
        this.comissionPorcent = true;
        this.comissionMultiple = false
        break;
      default:
        console.error("NINGUNO ES VALIDO")
        break;
    }
  }

  typeComissionServiceAssign(event) {
    switch (event.value) {
      case 'FIJO':
        this.comissionFixed = true;
        this.comissionMultiple = false;
        this.comissionPorcent = false
        break;
      case 'MULTIPLE':
        this.comissionFixed = true
        this.comissionMultiple = true;
        this.comissionPorcent = true;
        break;
      case 'PORCENTUAL':
        this.comissionFixed = false; //revisar
        this.comissionPorcent = true;
        this.comissionMultiple = false
        break;
      default:
        console.error("NINGUNO ES VALIDO")
        break;
    }
  }
  // selectedService(event) {
  //   // Usar directamente el servicio seleccionado sin hacer llamada HTTP
  //   this.dataService = event.value;
  // }

  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  // De una persona a varios servicios
  registerServiceAssign() {
    //Comprobar si existe al menos un servicio seleccionado
    if (!this.dataServiceSelectedIds || this.dataServiceSelectedIds.length === 0) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar un servicio para asignar.');
      return;
    }
    // Comprobar si existe un solo servicio seleccionado
    if (this.dataServiceSelectedIds.length > 1) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar un solo servicio para asignar.');
      return;
    }
    //Si pasa a esta parte es pq existe un solo servicio seleccionado(dataServiceSelected)

    //Limpiar cuando se cambie de tipo de comisión
    this.dataRegister = this.data.map(value => ({
      idProvider: '00000100',// ID ´PROVEEDOR
      idClient: value.idPerson, //ID DE RECAUDADORA
      idServiceProv: this.dataServiceSelected.id_serviceProv, //id de convenio
      serviceName: this.dataServiceSelected.name, //nnomb de servicio
      userRegistration: this.cookies.get('person_id') || 'desconocido',
      idTypeService: this.dataServiceSelected.serviceType.id,
      typeService: this.dataServiceSelected.serviceType.name,//master
      business: this.dataServiceSelected.business, //nombre de negocio
      status: this.dataServiceSelected.status,
      zone: 'MULTIDEPARTAMENTAL',
      collectorName: "",//vacio cuando son clientes // somos proveedores
      ownFixedComission: this.fixed.value ?? 0, //numeber
      ownCriterionComission: this.multiple ?? 0, //number
      ownPCTComission: this.porcent ?? 0, //number
      ownComissionType: this.comission,
      indicators: this.dataServiceSelected.indicators,
      additionalPaymentFields: this.dataServiceSelected.additional,
      comissionFixed: this.dataServiceSelected.fixedcomission, //number
      comissionPCT: this.dataServiceSelected.pctcomission, //number
    }))
    this.registerServiceRequest(this.dataRegister)
  }



  clearRegister() {
    this.data = [];
    this.dataRegister = [];
    this.dataServicesEntity = [];
    this.selectedPerson = ''
    this.service.setValue('');
    this.entity.setValue('');
  }

  serviceEntity() {
    this.oneView = true;
    this.twoView = false;
    this.zeroView = false;
    this.cancel = true;
    this.showIdClientDialog = false;
    this.showExcelUpload = false;
  }

  entityService() {
    this.twoView = true;
    this.oneView = false;
    this.zeroView = false;
    this.cancel = true;
    this.initExcelUploadState();
  }

  cancelar() {
    this.twoView = false;
    this.oneView = false;
    this.zeroView = true;
    this.cancel = false;
    this.showIdClientDialog = false;
    this.showExcelUpload = false;
    this.clearExcelData();
    this.clearRegister();
    this.cancelExcelUpload();
  }

  chunkArray(array: any[], size: number): any[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
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
          this.mytoastr.showWarning('No se registro ningun item', '')
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
        this.clearExcelData();
        this.cancelExcelUpload();
        //this.router.navigate(['../assign/list'])
        this.spinner.spinnerOnOff();

      }
    })
  }


  //Asiganción por archivo
  // Método para mostrar el diálogo de ID Cliente
  showExcelUploadDialog() {
    this.showIdClientDialog = true;
    this.requiredIdClient = '';
    setTimeout(() => {
      this.showIdClientDialog = true;
    }, 0);
  }
  // Método para confirmar el ID Cliente e iniciar la carga
  confirmIdClient() {
    if (!this.requiredIdClient.trim()) {
      this.mytoastr.showWarning('Error', 'Debe ingresar un ID Cliente válido');
      return;
    }
    this.disableEntities = true; // Deshabilitar la selección de entidades
    this.showIdClientDialog = false;
    this.showExcelUpload = true;
  }

  // Método para cancelar el diálogo
  cancelIdClientDialog() {
    this.showIdClientDialog = false;
    this.requiredIdClient = '';
  }

  // Método para manejar la selección de archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.mytoastr.showWarning('Error', 'Por favor seleccione un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      this.selectedFile = file;
    }
  }

  // Método para procesar el archivo Excel
  async processExcelFile() {
    if (!this.selectedFile) {
      this.mytoastr.showWarning('Error', 'Por favor seleccione un archivo');
      return;
    }

    this.isProcessingExcel = true;
    this.spinner.spinnerOnOff();

    try {
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const excelData = XLSX.utils.sheet_to_json(worksheet);

      // Procesar los datos usando la lógica del script original
      const processedData = this.convertExcelToAssignmentFormat(excelData);
      if (processedData.length === 0) {
        this.mytoastr.showWarning('Error', 'No se encontraron datos válidos en el archivo');
        return;
      }

      // Asignar los datos procesados para mostrar en la tabla
      this.excelData = processedData;
      this.data = this.convertDataForTable(processedData);

      this.mytoastr.showSuccess('Archivo procesado correctamente', `Se cargaron ${processedData.length} registros`);

    } catch (error) {
      console.error('Error procesando archivo Excel:', error);
      this.mytoastr.showError('Error', 'Error al procesar el archivo Excel');
    } finally {
      this.isProcessingExcel = true;
      this.disableFile = true;
      this.spinner.spinnerOnOff();
    }
  }

  // Método para convertir datos de Excel al formato de asignación
  convertExcelToAssignmentFormat(excelData: any[]): any[] {
    const idProvider = "00000100"; // ID fijo del proveedor

    return excelData.map(row => {
      const jsonObj = {
        idProvider: idProvider,
        idClient: this.requiredIdClient, // Usar el ID Cliente ingresado
        idService: row["CÓDIGO DE SERVICIO"] || "",
        serviceName: row["NOMBRE DE SERVICIO"] || "",
        idServiceProv: row["CODIGO DE SERVICIO DEL PROVEEDOR"] || "",
        codProveedor: row["CODIGO DEL PROVEEDOR"] || "",
        userRegistration: this.cookies.get('person_id') || 'desconocido',
        status: row["ESTADO"] || "",
        zone: "MULTIDEPARTAMENTAL",
        ownFixedComission: "",
        ownCriterionComission: "",
        ownPCTComission: "",
        ownComissionType: "",
        comissionFixed: "",
        comissionPCT: "",
      };

      const tipoComision = row["TIPO DE COMISION"] || "";
      const valorComision = row["VALOR DE COMISION"] || "";

      // Lógica de comisiones del script original
      if (tipoComision === "Comisión fija") {
        jsonObj.ownComissionType = "FIJO";
        jsonObj.comissionFixed = valorComision;
        jsonObj.ownFixedComission = valorComision;
      } else if (tipoComision === "Comsión porcentual sobre el monto" ||
        tipoComision === "Comisión porcentual sobre el monto") {
        jsonObj.ownComissionType = "PORCENTUAL";
        jsonObj.ownPCTComission = valorComision;
        jsonObj.comissionPCT = valorComision;
      } else if (tipoComision === "Comisión Múltiple") {
        jsonObj.ownComissionType = "MULTIPLE";
      }

      return jsonObj;
    });
  }

  // Método para convertir datos para mostrar en la tabla dinámica
  convertDataForTable(data: any[]): any[] {
    return data.map(item => ({
      idService: item.idService,
      serviceName: item.serviceName,
      idServiceProv: item.idServiceProv,
      codProveedor: item.codProveedor,
      status: item.status,
      ownComissionType: item.ownComissionType,
      ownFixedComission: item.ownFixedComission,
      ownPCTComission: item.ownPCTComission,
      zone: item.zone
    }));
  }

  // Método para confirmar y enviar las asignaciones desde Excel
  confirmExcelAssignments() {
    if (this.excelData.length === 0) {
      this.mytoastr.showWarning('Error', 'No hay datos para procesar');
      return;
    }

    // Usar el método existente para registrar las asignaciones
    this.registerServiceRequest(this.excelData);
  }

  // Método para cancelar la carga de Excel
  cancelExcelUpload() {
    this.showExcelUpload = false;
    this.isProcessingExcel = false;
    this.disableFile = false;
    this.disableEntities = false;
    this.selectedFile = null;
    this.excelData = [];
    this.data = [];
  }

  // Método para limpiar los datos de Excel
  clearExcelData() {
    this.excelData = [];
    this.data = [];
    this.selectedFile = null;
    this.isProcessingExcel = false;
    this.disableFile = false;
  }

  /******************************************** METODOS PARA LOS BOTONES ******************************************/



  searchService(pageSize: any) {
    this.dataServiceSelected = null;//Limpiar el servicio seleccionado
    this.dataServiceSelectedIds = []; // Limpiar los IDs seleccionados

    this.spinner.spinnerOnOff();
    //Obtenemos los servicios que se encuentran habilitados
    this.serviceServ.getServices(this.service.value, 'HABILITADO', null, this.categoryService.value?.master_name, this.count, pageSize, this.pageKey).subscribe({
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
        this.spinner.spinnerOnOff();
      }
    })
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

  /*********************************************** METODOS PARA EL PAGINADO Y OTROS *****************************************/
  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  handleSelectedIds(selectedIds: string[]) {
    this.dataServiceSelectedIds = selectedIds; // Asignar los IDs seleccionados a dataServiceSelectedIds
  }

  selectedHandle(event: any) {
    if (event && event.length > 0) {//Verificar si hay almenos uno seleccionado, sino limpiamos la seleccion
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

  /********************************* METODOS PARA INPUTS ****************************************************/
  validComissionFixed(): void {//Validamos que la comisión fija de la asignación, sea menor a la comisión fija del servicio
    if (this.dataServiceSelected?.fixedcomission && this.fixed.value) {
      if (Number(this.fixed.value) > this.dataServiceSelected.fixedcomission) {
        this.mytoastr.showWarning('La comisión fija debe ser menor que la comisión fija del servicio: ', this.dataServiceSelected.fixedcomission.toString());
        this.fixed.setValue('');
      }
    }
  }


  /************************************** METODOS PARA VALIDACIONES **************************************************/

  disabledBtnRegister(): boolean {
    return !this.dataServiceSelected || !this.data || this.data.length == 0;
  }




  /*************************************** METODOS GET DEL FORMULARIO ********************************************/
  get categoryService() { return this.formAssign.get('categoryService') };
  get service() { return this.formAssign.get('service') };
  get entity() { return this.formAssign.get('entity') };
    get fixed() { return this.formAssign.get('fixed') };
  get comission() { return this.formAssign.get('comission').value };
  get multiple() { return this.formAssign.get('multiple').value };
  get porcent() { return this.formAssign.get('porcent').value };
}
