import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService} from 'src/app/services/person.service';//aqui se hizo cambio
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { TransactionService } from 'src/app/services/transaction.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UserService } from 'src/app/services/user.service';
import { DialogPersonaStatusComponent } from 'src/app/dialogs/dialog-persona-status/dialog-persona-status.component';
import { MatTableDataSource } from '@angular/material/table';



@Component({
  selector: 'uni-status-conciliation',
  templateUrl: './status-conciliation.component.html',
  styleUrls: ['./status-conciliation.component.scss']
})
export class StatusConciliationComponent implements OnInit {
  funcionDelPadre() {
    console.log("Funcion del padre ejecutado desde el hijo");
  }

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre Alias', 'attribute': 'nameAlias' },
    { 'name': 'Tipo Entidad', 'attribute': 'typeService' },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
    { //boton deslizador
      name: 'Estado Toggle',
      attribute: 'status',
      config: { isToggle: true }
    }
  ];


  public options: any[] = [
    { value: 'Persona', id: '1' },
    // { value: 'Tipo de Cliente', id:'2'}
  ]
  public currentStep: number = 0;
  //public dataPerson = [];
  public dataUser = [];
  public pageSize: any = 5;
  public pageKey: any[];
  public close: boolean = false;
  public nameAlias: any[]
  public selectedAlias: string;
  public functionDataCurrent: (pageSize: any) => any;
  public disabledEditOption: any
  public selectedIds: any;
  public typeEntity: any;
  public optionsType: any;
  public viewData: boolean = true
  public listpersonForm!: FormGroup;
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  public nombre: string = 'Paul';
  public count: number = null; // Variable para el total de elementos
  public dataFilter: any = [];

  dataPerson: any[] = [];

  constructor(
    private router: Router,
    private personService: PersonService,
    private fb: FormBuilder,
    private masterService: MasterService,
    private myToastr: MytoastrService,
    private spinner: SpinnerService,
    public dialog: MatDialog,
    private userService: UserService
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formlistperson();//inicializa los inputs como vacios
    this.itemMaster();// UTIL | carga los tipos de entidades
    //this.functionDataCurrent = this.getPersonData.bind(this);// UTIL | la fn guarda por primera vez algo en la tabla de personans
    //this.functionDataCurrent(this.pageSize);
    this.functionDataCurrent = this.dataByTypeEntity.bind(this); //replica la funcion
    this.functionDataCurrent(this.pageSize);
  }

  dataByTypeEntity(pageSize: any) {
    console.log('this.typeEntity_form');
    console.log(this.typeEntity_form.value.master_relativeName);

    const typeEntity = this.typeEntity_form.value.master_relativeName?.toUpperCase();
    const person = this.person.value?.toUpperCase();

    this.spinner.spinnerOnOff();
    // return
    console.log("pag key:");
    console.log(this.pageKey);
    this.personService.getPersonForStatusConciliation(typeEntity, person, this.count, pageSize, this.pageKey).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.myToastr.showWarning(data.messages, '')
          return
        }
        //this.dataService = [...this.dataService, ...data.data.Items]; // Acumula los datos en dataFilter
        //console.log(...data.data.Items);
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter
        console.log('s.dataFilter[0]')
        console.log(this.dataFilter[0]);
        this.dataPerson = this.dataFilter.map(item => ({
          ...item,
          typeService: item.typeService?.typeEntity || ''
        }));
        
        //FILTRAR ALIAS SIN REPETIR
        this.nameAlias = this.dataPerson.filter(
          (item, index, self) =>
            item.nameAlias && self.findIndex((t) => t.nameAlias === item.nameAlias) === index
        );
        console.log("DATA name : ", this.nameAlias)
        //console.log("this.dataFilter: "+this.dataFilter);
        //console.log("this.dataService: "+this.dataService);
        console.log("data.data.nextPageKey:");
        console.log(data.data.nextPageKey);
        console.log("this.count:");
        console.log(this.count);
        console.log("data.data.Count:");
        console.log(data.data.Count);
        if (this.dataPerson.length == this.count) {//se recuperaron todos los datos
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
  formlistperson() {
    this.listpersonForm = this.fb.group({
      typeEntity_form: [''],
      person: ['']
    })
  }

  handleSelectedIds(selectedIds: any[]) {
    // console.log("Id's: ", selectedIds)
    // this.disabledDeletOption = selectedIds.length !== 1;
    this.disabledEditOption = selectedIds?.length !== 1;
    this.selectedIds = selectedIds;
    console.log("Id--s: ", selectedIds)
  }

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataPerson = [];
    this.dataFilter = [];
  }
  clearData2() {
    //this.count = null;
    this.pageKey = undefined;
    this.dataPerson = [];
    //this.dataFilter = [];
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }

  getPersonData(pageSize?: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getPersonData)
    // return
    this.personService.getPersons(pageSize, this.pageKey).subscribe({
      next: (value: any) => {
        console.log("prueba salidaaa ", value);
        if (value.statusCode === 201) {
          this.myToastr.showWarning(value.messages || 'No se encontraron clientes', '');
          return
        }

        let personData = value.data.map(item => ({
          nameAlias: item.servicePerson?.nameAlias || '-',
          zone: item.servicePerson?.zone || '-',
          typeDoc: item.servicePerson?.typeDoc || '-',
          status: item.servicePerson?.status || '-',
          typeService: item.servicePerson?.typeService.typeEntity || '-',
          id: item.servicePerson?.id || '-'
        }));
        this.dataPerson = [...this.dataPerson, ...personData];// carga datos de personas
        this.pageKey = value.nextPageKey ?? null
        console.log("DATA DE TRANSACTION: ", value.data)//dataPerson
      },
      error: (error: any) => {
        console.error('ERROR', error);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
    this.functionDataCurrent = this.getPersonData
  }

  resetUser(current: any) {
    this.pagUtils?.resetIfChanged(
      current,
      this.functionDataCurrent,
      this.clearData.bind(this)
    )
  }

  selectedValue
  stringFilter

 
  //busca la data de personas por entidad
  getData(type) {
    console.log("typo:" + type);
    this.spinner.spinnerOnOff();
    this.personService.getPersonAll(type).subscribe({
      next: (value) => {
        console.log("value.statusCode:");
        console.log(value.statusCode);
        if (value.statusCode !== 200) {
          this.myToastr.showError('Error al cargar datos..', '');
          this.spinner.spinnerOnOff();
          return
        }
        //this.reload();
        //repetido...
        this.dataPerson = value.data.map((item:any) => ({
          nameAlias: item?.nameAlias || '-',
          zone: item?.zone || '-',
          typeDoc: item?.typeDoc || '-',
          status: item?.status || '-',
          idPerson: item?.idPerson || '-'
        }));
        //FILTRAR ALIAS SIN REPETIR
        this.nameAlias = this.dataPerson.filter(
          (item, index, self) =>
            item.nameAlias && self.findIndex((t) => t.nameAlias === item.nameAlias) === index
        );
        this.spinner.spinnerOnOff();
        console.log("DATA name : ", this.nameAlias)
         console.log("value.data.nextPageKey:");
        console.log("this.count:");
        console.log(this.count);
        console.log("value.Count:");
        console.log(value.data.totalItems);
        /*
        if (this.dataPerson.length == this.count) {//se recuperaron todos los datos
          this.pageKey = null;
        } else {
          this.pageKey = value.data.nextPageKey ?? null;
        }*/
        this.count = value.data.totalItems ?? 0;
      },
      error(error) {
        console.error("ERROR: ", error)
        this.spinner.spinnerOnOff();
      }
    })
  }


  entitySelect: string

  //FUNCION DE BUSQUEDA DE PERSONAS POR TIPO DE ENTIDAD
  selectedEntity(event) {
    this.clearData();
    //nueva
    //this.dataByTypeEntity(this.pageSize)
    //antigua
    this.entitySelect = event.value.master_relativeName.toUpperCase();
    this.getData(this.entitySelect) //FUNCION DE BUSQUEDA DE PERSONAS POR TIPO DE ENTIDAD
    this.selectedIds = null
  }

  selectAlias(event) {
    this.selectedAlias = event.value.nameAlias.toUpperCase();
    console.log("VALOR ALIAS1: ", this.selectedAlias)
    this.spinner.spinnerOnOff();
    this.personService.getPersonAll(null, this.selectedAlias).subscribe({
      next: (value) => {
        console.log("V=ALOR ALIAS2: ", value.data)
        //this.reload();
        this.dataPerson = value.data.Items2.map(item => ({
          nameAlias: item.name,
          typeService: item.typeEntity,
          zone: item.zone,
          typeDoc: '-',
          status: item.status,
          idPerson: item.idPerson
        }))
        
        this.spinner.spinnerOnOff();
        // const data[] = {
        //   nameAlias:value.data.name,
        //   typeService: value.data.typeEntity,
        //   zone : value.data.zone,
        //   typeDoc:'-',
        //   status :'-'
        // }
        // this.dataUser = data 
        this.count = value.data.tamaño ?? 0;
      },
      error(err) {
        this.myToastr.showError('Error al cargar datos..', '');
        this.spinner.spinnerOnOff();
        console.error("Error: ", err)
      },
    })
    this.handleSelectedIds(null)

  }



  itemMaster() {
    forkJoin([
      this.masterService.getItemsMasterTable('11')
    ]).subscribe({
      next: ([typeEntity]) => {
        this.typeEntity = typeEntity.sort((a, b) => a.master_order - b.master_order);
        console.log("ENTIDAD: ", this.typeEntity)
      }
    })
  }

  onToggleChange(event: any): void {
    console.log('event en onToggleChange')
    console.log(event)
    const { element, checked } = event;
    const dialogRef = this.dialog.open(DialogPersonaStatusComponent, {
      width: '600px',
      data: {
        id: element.idPerson,
        nameAlias: element.nameAlias,
        entityType: element.typeService,
        checked: checked
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log("Modal cerrado con:", result);
      if (this.entitySelect == undefined && this.selectedAlias == undefined) {
        //llamar a busqueda sin filtros.
        console.log("filtros no definidos");
        //this.getPersonData(this.pageSize);
        this.reload();
      } else {
        console.log("filtros definidos");
        this.getPersonInit(); // 🔄 recarga todo después de actualizar segun el filtro
      }
    });
  }

  getPersonInit() {
    console.log("typo:" + this.entitySelect);
    console.log("selectedAlias:" + this.selectedAlias);

    this.spinner.spinnerOnOff();
    this.personService.getPersonAll(this.entitySelect, this.selectedAlias).subscribe({
      next: (value) => {
        if (value.statusCode !== 200) {
          this.myToastr.showError('Error al cargar datos..', '');
          this.spinner.spinnerOnOff();
          return
        }
        console.log(value.data)
        //this.reload();
        this.dataPerson = value.data.Items.map(item => ({
          nameAlias: item?.nameAlias || '-',
          zone: item?.zone || '-',
          typeDoc: item?.typeDoc || '-',
          status: item?.status || '-',
          typeService: item?.typeService.typeEntity || '-',
          idPerson: item?.idPerson || '-'
        }));
        //FILTRAR ALIAS SIN REPETIR
        /*
        this.nameAlias=this.dataPerson.filter(
          (item, index, self) =>
            item.nameAlias && self.findIndex((t) => t.nameAlias === item.nameAlias) === index
        );
        */
        this.count = value.data.totalItems ?? 0;
        this.spinner.spinnerOnOff();
        console.log("DATA name : ", this.nameAlias)
      },
      error(error) {
        console.error("ERROR: ", error)
        this.spinner.spinnerOnOff();
      }
    })
  }
  exportDataViaAPI(fileType: 'xlsx' | 'csv') {
    console.log(`llamando para exportar ${fileType}`)

    let exportFilters;
    const bandeja = 'stc';
    if (this.entitySelect) {
      this.spinner.spinnerOnOff();
      exportFilters = {
        entitySelect: this.entitySelect,
        selectedAlias: this.selectedAlias
      }
    } else {
      this.myToastr.showError('', 'Primero selecciona un Tipo de Entidad');
      return
    }

    console.log('exportFilters: ', exportFilters)
    const token = localStorage.getItem('fcmToken');
    this.personService.exportEntitys(fileType, exportFilters, bandeja, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.myToastr.showWarning('', 'Procesando Archivo...')
        } else {
          this.myToastr.showError('', 'Error al enviar la solicitud')
        }
      },
      error: (error) => {
        console.error('Error al exportar los datos:', error);
        this.myToastr.showError('Error al exportar los datos', '');
        this.spinner.spinnerOnOff();
      }
    });
  }
  /******************************************** METODOS GET ****************************************/

  get person() {
    return this.listpersonForm.get('person')
  }
  get typeEntity_form() {
    return this.listpersonForm.get('typeEntity_form')
  }
}
