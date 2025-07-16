import { Component, OnInit } from '@angular/core';
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
//

@Component({
  selector: 'uni-assign',
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.scss']
})
export class AssignComponent implements OnInit {

  public formAssign!: FormGroup<any>
  public formAssignService!: FormGroup<any>

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
  public filteredServices: any[] = []; // Lista filtrada que se mostrará
  public serviceFilter: string = '';
  public typeComission: any;
  public persons: any;
  public category: any;
  public disableEntities = false;
  public disableAll = false;
  public comissionFixed: boolean = true;
  public comissionPorcent: boolean = false;
  public comissionMultiple: boolean = false;
  public dataService: any;
  public oneView: boolean = false;
  public twoView: boolean = false;
  public zeroView: boolean = true;
  public cancel: boolean = false;
  public dataServicesEntity: any;
  public allItems: any;
  public dataRegister: any;
  public disableServiceAll: boolean = false;
  public disableServiceOption: boolean = false;
  public dataRegisterService:any;

  // propiedades para la carga de un archivo excel
  public showExcelUpload: boolean = false;
  public selectedFile: File | null = null;
  public excelData: any[] = [];
  public isProcessingExcel: boolean = false;
  public requiredIdClient: string = '';
  public showIdClientDialog: boolean = false;
  //------------------

  constructor(
    private serviceServ: ServicesService,
    private masterService: MasterService,
    private personService: PersonService,
    private fb: FormBuilder,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private cookies: CookieService
  ) { }

  ngOnInit(): void {
    this.listData();
    this.initialForm();
    this.loadAllServices().subscribe(allItems => {
      // Filtrar solo los servicios habilitados
      this.allItems = allItems.filter(service => service.status === "HABILITADO");
      this.filteredServices = this.allItems;
    });
  }

  //Primero hacer que se registre uno por uno
  //Probar que me traigan los 58 actuales y que se puedan asignar
  //Si funciona, pedir que se suban los 2000 y hacer las mismas pruebas, pero con los 2000
  //No olvidar validar que existan los servicios
  loadAllServices() {  //revisar para que traiga los 2000
    return this.serviceServ.getServicesPageKey().pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(response.data.nextPageKey)
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
      service: [''],
      entity: [''],
      comission: ['FIJO', Validators.required],
      fixed: [''],
      porcent: [''],
      multiple: [''],
    });

    this.formAssignService = this.fb.group({
      service: [''],
      entity: [''],
      comission: ['FIJO', Validators.required],
      fixed: [''],
      porcent: [''],
      multiple: [''],
    })
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('15'), // tipoComission
      this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
    ]).subscribe({
      next: (response) => {
        const [typeComission, person] = response;
        this.typeComission = typeComission;
        this.persons = person.data;
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

  selectEntity(event) {
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




  selectedServiceAssing(event) {
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

  listEntitySelect(list) {
    this.data = this.convertData(list)
  }

  convertDataService(data) {
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

  convertData(data) {
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
  selectedService(event) {
    // Usar directamente el servicio seleccionado sin hacer llamada HTTP
    this.dataService = event.value;
  }

  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  // De una persona a varios servicios
  registerServiceAssign() {
    // Comprobar si existe un servicio seleccionado
    if (!this.dataService) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar un servicio válido primero');
      return;
    }

    // Comprobar si existen entidades seleccionadas
    if (!this.data || this.data.length === 0) {
      this.mytoastr.showWarning('Error', 'Debe seleccionar al menos una entidad');
      return;
    }
    //Limpiar cuando se cambie de tipo de comisión
    this.dataRegister = this.data.map(value => ({
      idProvider: '00000100',// ID ´PROVEEDOR
      idClient: value.idPerson, //ID DE RECAUDADORA
      idServiceProv: this.dataService.id_serviceProv, //id de convenio
      serviceName: this.dataService.name, //nnomb de servicio
      userRegistration: this.cookies.get('person_id') || 'desconocido',
      idTypeService: this.dataService.serviceType.id,
      typeService: this.dataService.serviceType.name,//master
      business: this.dataService.business, //nombre de negocio
      status: this.dataService.status,
      zone: 'MULTIDEPARTAMENTAL',
      collectorName: "",//vacio cuando son clientes // somos proveedores
      ownFixedComission: this.fixed ?? 0, //numeber
      ownCriterionComission: this.multiple ?? 0, //number
      ownPCTComission: this.porcent ?? 0, //number
      ownComissionType: this.comission,
      indicators: this.dataService.indicators,
      additionalPaymentFields: this.dataService['additional-payment-fields']
    }))
    this.registerServiceRequest(this.dataRegister)
  }

  registerServiceEntity() {
    this.dataRegisterService = this.dataServicesEntity.map((value) => ({

      idProvider: '00000100',// ID ´PROVEEDOR
      idClient: this.selectedPerson.servicePerson.idPerson, //ID DE RECAUDADORA
      idServiceProv: value.id_serviceProv, //id de convenio
      serviceName: value.name, //nnomb de servicio
      userRegistration: this.cookies.get('person_id') || 'desconocido',
      idTypeService: value.serviceTypeId,
      typeService: value.serviceTypeName,//master
      business: value.business, //nombre de negocio
      status: value.status,
      zone: 'MULTIDEPARTAMENTAL',
      collectorName: "",//vacio cuando son clientes // somos proveedores
      ownFixedComission: this.fixedAssign ?? 0, //numeber
      ownCriterionComission: this.multipleAssign ?? 0, //number
      ownPCTComission: this.porcentAssign ?? 0, //number
      ownComissionType: this.comissionAssign,
      indicators: value.indicators,
      additionalPaymentFields: value.additional

    }))

    this.registerServiceRequest(this.dataRegisterService)
  }

  clearRegister() {
    this.data = [];
    this.dataRegister = [];
    this.dataServicesEntity = [];
    this.selectedPerson = ''
    this.serviceAssign.setValue('');
    this.service.setValue('');
    this.entity.setValue('');
    this.fixedSet = ''
    this.fixedSetAssign = ''
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
        this.clearRegister()
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
      this.isProcessingExcel = false;
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
        ownComissionType: ""
      };

      const tipoComision = row["TIPO DE COMISION"] || "";
      const valorComision = row["VALOR DE COMISION"] || "";

      // Lógica de comisiones del script original
      if (tipoComision === "Comisión fija") {
        jsonObj.ownComissionType = "FIJO";
        jsonObj.ownFixedComission = valorComision;
      } else if (tipoComision === "Comsión porcentual sobre el monto" ||
        tipoComision === "Comisión porcentual sobre el monto") {
        jsonObj.ownComissionType = "PORCENTUAL";
        jsonObj.ownPCTComission = valorComision;
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
    this.selectedFile = null;
    this.excelData = [];
    this.data = [];
  }

  // Método para limpiar los datos de Excel
  clearExcelData() {
    this.excelData = [];
    this.data = [];
    this.selectedFile = null;
  }

  //#########################################

  get service() {
    return this.formAssign.get('service')
  }

  get serviceAssign() {
    return this.formAssign.get('service')
  }
  get entity() {
    return this.formAssign.get('entity')
  }
  get entityAssign() {
    return this.formAssignService.get('entity')
  }
  get comission() {
    return this.formAssign.get('comission').value
  }
  get comissionAssign() {
    return this.formAssignService.get('comission').value
  }
  get fixed() {
    return this.formAssign.get('fixed').value
  }
  set fixedSet(value: any) {
    this.formAssign.get('fixed')?.setValue(value);
  }
  get multiple() {
    return this.formAssign.get('multiple').value
  }
  get porcent() {
    return this.formAssign.get('porcent').value
  }

  get fixedAssign() {
    return this.formAssignService.get('fixed').value
  }
  set fixedSetAssign(value: any) {
    this.formAssignService.get('fixed')?.setValue(value);
  }
  get multipleAssign() {
    return this.formAssignService.get('multiple').value
  }
  get porcentAssign() {
    return this.formAssignService.get('porcent').value
  }

}
