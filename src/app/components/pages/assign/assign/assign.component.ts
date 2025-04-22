import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { expand, filter, forkJoin, of, reduce, scan, startWith } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

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
    // setTimeout(() => {
    this.loadAllServices().subscribe(allItems => {
      console.log("allItems: ", allItems)
      // Filtrar solo los servicios habilitados
      this.allItems = allItems.filter(service => service.status === "HABILITADO");
      console.log("Servicios habilitados: ", this.allItems);
    });

    //Desabilitado por pruebas
    // this.loadAllServices().subscribe(allItems => {
    //   console.log("allItems: ",allItems)
    //   this.allItems = allItems;
    // });
    // }, 0);
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

  //Desabilitado para pruebas
  // listData() {
  //   this.spinner.spinnerOnOff();
  //   forkJoin([
  //     this.serviceServ.getServices(),
  //     this.masterService.getItemsMasterTable('15'), // tipoComission
  //     this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
  //   ]).subscribe({
  //     next: (response) => {
  //       const [service,typeComission,person] = response;
  //       this.serviceName = service.data?.Items;
  //       this.typeComission = typeComission;
  //       this.persons = person.data;
  //       console.log("SERVICIOS: ",this.persons)

  //       // this.spinner.spinnerOnOff();
  //     },
  //     error: (error) => {
  //       this.spinner.spinnerOnOff();
  //       console.error("Error loading master table data:", error);
  //     },
  //     complete:()=> {
  //         this.spinner.spinnerOnOff();
  //     },
  //   });
  // }
  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.serviceServ.getServices(),
      this.masterService.getItemsMasterTable('15'), // tipoComission
      this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
    ]).subscribe({
      next: (response) => {
        const [service, typeComission, person] = response;
        this.serviceName = service.data?.Items;
        this.typeComission = typeComission;
        this.persons = person.data;
        console.log("SERVICIOS: ", this.persons)

        // this.spinner.spinnerOnOff();
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
        console.log("response", response);
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
    console.log("evento ttiy: ", event.value)
    if (event.value == 'TODOS') {
      this.disableEntities = true
      // this.data = this.allItems;
      // console.log("dataAssign: ",this.data)
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

  selectedPerson
  selectAsignService(event) {
    this.selectedPerson = event.value
  }

  disableServiceAll: boolean = false
  disableServiceOption: boolean = false


  selectedServiceAssing(event) {
    console.log("evento services: ", event.value)
    if (event.value == 'TODOS') {
      this.disableServiceOption = true;
      this.dataServicesEntity = this.allItems;
      // this.dataServicesEntity = this.convertDataService(this.serviceName)
    } else {
      this.disableServiceOption = false
      this.disableServiceAll = true
      this.dataServicesEntity = this.convertDataService(event.value)
      console.log("dataServiceEntity: ", this.dataServicesEntity)
    }

    if (event.value.length === 0) {
      this.disableServiceAll = false;
    }

  }

  listEntitySelect(list) {
    this.data = this.convertData(list)
    // this.data.push(list)
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
    console.log("eventos comission: ", event.value)
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
    console.log("eventos comission: ", event.value)
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

  // selectedService(event){
  //   console.log("EVENTO VALUE: ",event.value)
  //   this.getServiceId(event.value.id)
  // }

  selectedService(event) {
    console.log("EVENTO VALUE: ", event.value)
    // Usar directamente el servicio seleccionado sin hacer llamada HTTP
    this.dataService = event.value;
    console.log("DATASERVICIO: ", this.dataService);
  }

  //Desabilitado para pruebas
  // getServiceId(id:string){
  //   this.serviceServ.getIdServices(id).subscribe({
  //     next: (response) => {
  //       if(response.statusCode !== 200){
  //         this.mytoastr.showWarning('Servicio no encontrado','')
  //         return
  //       }
  //       this.dataService = response.data[0];
  //       console.log("ADATASERVICIO: ",this.dataService)
  //     },
  //     error: (error) => {
  //       this.mytoastr.showWarning('Error : Servicio no encontrado','')
  //       console.error(error)
  //     }
  //   })
  // }

  dataRegister
  //Desabilitado para pruebas
  // registerServiceAssign() {
  //   // this.spinner.spinnerOnOff();
  //   console.log("DATA servicio a entidades: ", this.data)
  //   // return
  //   this.dataRegister = this.data.map(value => ({

  //     idProvider: '00000100',// ID ´PROVEEDOR
  //     idClient: value.idPerson, //ID DE RECAUDADORA
  //     idServiceProv: this.dataService.id_serviceProv, //id de convenio
  //     serviceName: this.dataService.name, //nnomb de servicio
  //     userRegistration: this.cookies.get('person_id') || 'desconocido',
  //     idTypeService: this.dataService.serviceType.id,
  //     typeService: this.dataService.serviceType.name,//master
  //     business: this.dataService.business, //nombre de negocio
  //     status: this.dataService.status,
  //     zone: 'MULTIDEPARTAMENTAL',
  //     collectorName: "",//vacio cuando son clientes // somos proveedores
  //     ownFixedComission: this.fixed ?? 0, //numeber
  //     ownCriterionComission: this.multiple ?? 0, //number
  //     ownPCTComission: this.porcent ?? 0, //number
  //     ownComissionType: this.comission,
  //     indicators: this.dataService.indicators,
  //     additionalPaymentFields: this.dataService['additional-payment-fields']
  //   }))
  //   // return
  //   console.log("data de registro: ", this.dataRegister)

  //   this.registerServiceRequest(this.dataRegister)

  // }


  // De una persona a varios servicios
  registerServiceAssign(){
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

    console.log("DATA servicio a entidades: ",this.data)
    //Limpiar cuando se cambie de tipo de comisión
    this.dataRegister = this.data.map(value=>({
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
        indicators:this.dataService.indicators,
        additionalPaymentFields: this.dataService['additional-payment-fields']
      }))

    console.log("data de registro: ", this.dataRegister)
    this.registerServiceRequest(this.dataRegister)
  }

  dataRegisterService
  registerServiceEntity() {
    console.log("fijo: ", this.fixedAssign)
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

    console.log("dataregisterService : ", this.dataRegisterService);
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
    this.cancel = true
  }

  entityService() {
    this.twoView = true;
    this.oneView = false;
    this.zeroView = false;
    this.cancel = true
  }

  cancelar() {
    this.twoView = false;
    this.oneView = false;
    this.zeroView = true;
    this.cancel = false
  }

  chunkArray(array: any[], size: number): any[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }


  registerServiceRequest(data: any) {

    // const chunkedData = this.chunkArray(data, 1000);

    // chunkedData.forEach((chunk, index) => {
    //   console.log(`Enviando fragmento ${index + 1} de ${chunkedData.length}`);

    //   this.serviceServ.registerServiceAssign(chunk).subscribe({
    //     next: response => console.log(`Fragmento ${index + 1} enviado con éxito`, response),
    //     error: err => console.error(`Error en el fragmento ${index + 1}`, err)
    //   });
    // });

    this.spinner.spinnerOnOff();
    this.serviceServ.registerServiceAssign(data).subscribe({
      next: (response) => {
        // console.log("RESPUESTA DE REGISTRO: ", response)
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('Error : Algunos servicios ya fueron asignados', '')
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
