import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MasterService } from 'src/app/services/master2.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person2.service';//aqui se hizo cambio
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { TransactionService } from 'src/app/services/transaction.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UserService } from 'src/app/services/user2.service';
import { DialogPersonaHabComponent } from 'src/app/dialogs/dialog-persona-hab/dialog-persona-hab.component';
import { DialogPersonEntityTypeComponent } from 'src/app/dialogs/dialog-person-entity-type/dialog-person-entity-type.component';
import { DialogPersonaStatusComponent } from 'src/app/dialogs/dialog-persona-status/dialog-persona-status.component';
import { MatTableDataSource } from '@angular/material/table';



@Component({
  selector: 'uni-status-conciliation',
  templateUrl: './status-conciliation.component.html',
  styleUrls: ['./status-conciliation.component.scss']
})
export class StatusConciliationComponent implements OnInit {
  funcionDelPadre(){
    console.log("Funcion del padre ejecutado desde el hijo");
  }

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre Alias', 'attribute': 'nameAlias' },
    { 'name': 'Tipo Entidad', 'attribute': 'typeService'},
    { 'name': 'Estado', 'attribute': 'status','config':{
        'styleClass': true 
    }},
    { //boton deslizador
      name: 'Estado Toggle', 
      attribute: 'status', 
      config: { isToggle: true } 
    }
  ];


  public options: any[] = [
    { value: 'Persona', id:'1'},
    // { value: 'Tipo de Cliente', id:'2'}
  ]
  public currentStep : number = 0;
  //public dataPerson = [];
  public dataUser = [];
  public pageSize: any = 5;
  public pageKey: any[];
  public close : boolean = false;
  public nameAlias : any []
  public selectedAlias : string;
  public functionDataCurrent: (pageSize: any) => any;
  public disabledEditOption: any
  public selectedIds: any;
  public typeEntity : any;
  public optionsType : any;
  public viewData : boolean = true
  public listpersonForm!: FormGroup;
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  public nombre: string = 'Paul';
  
  dataPerson: any[] = [];
  
  constructor(
    private router : Router,
    private personService : PersonService,
    private fb: FormBuilder,
    private masterService : MasterService,
    private myToastr : MytoastrService,
    private spinner : SpinnerService,
    public dialog: MatDialog,
    private userService : UserService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formlistperson(); 
    this.itemMaster();// UTIL | carga los tipos de entidades
    this.functionDataCurrent = this.getPersonData.bind(this);// UTIL | la fn guarda por primera vez algo en la tabla de personans
    this.functionDataCurrent(this.pageSize);
    this.getUser();
  }

  getUser(){
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.dataUser = response.Items
        console.log("repuesta: ",response)
      }
    })
  }
 formlistperson(){
    this.listpersonForm = this.fb.group({
     
      typeEntity: [''],
      person: [''],
    })
  }
  addPerson(){
    this.router.navigate(['/persons/add'])
  }

  handleSelectedIds(selectedIds: any[]) {
    // console.log("Id's: ", selectedIds)
    // this.disabledDeletOption = selectedIds.length !== 1;
    this.disabledEditOption = selectedIds?.length !== 1;
    this.selectedIds = selectedIds;
    console.log("Id--s: ", selectedIds)
  }

  clearData() {
    this.pageKey = undefined;
    this.dataPerson = [];
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

  editElement() {
    // this.selectedIds
    this.router.navigate([`/persons/edit/${this.selectedIds}`]);
  }

  getPersonData(pageSize?: any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getPersonData)
    // return
    this.personService.getPersons(pageSize,this.pageKey).subscribe({
      next: (value:any) => {
        if(value.statusCode === 201){
          this.myToastr.showWarning(value.messages || 'No se encontraron clientes','');
          return
        }
        console.log("prueba salidaaa ", value);
        
        let personData = value.data.map(item => ({
          nameAlias: item.servicePerson?.nameAlias || '-',
          zone: item.servicePerson?.zone || '-',
          typeDoc: item.servicePerson?.typeDoc || '-',
          status: item.servicePerson?.status || '-',
          typeService: item.servicePerson?.typeService.typeEntity || '-',
          id: item.servicePerson?.id || '-'
        }));
        this.dataPerson = [...this.dataPerson,...personData];// carga datos de personas
        this.pageKey = value.nextPageKey ?? null
        console.log("DATA DE TRANSACTION: " ,value.data)//dataPerson
      },
      error: (error: any) => {
        console.error('ERROR',error);
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

  selection(event ){
    this.selectedValue = event.value.attribute
    console.log("seleccionar valor: ",this.selectedValue)
  }
  //busca la data de personas por entidad
  getData(type){
    console.log("typo:" + type);
    
    this.spinner.spinnerOnOff();
    this.personService.getPerson(type).subscribe({
      next:(value)=> {
          if(value.statusCode !== 200){
            this.myToastr.showError('Error al cargar datos..','');
            this.spinner.spinnerOnOff();
            return
          }
          console.log(value.data)
          //this.reload();
          this.dataPerson = value.data.map(item => ({
            nameAlias: item.servicePerson?.nameAlias || '-',
            zone: item.servicePerson?.zone || '-',
            typeDoc: item.servicePerson?.typeDoc || '-',
            status: item.servicePerson?.status || '-',
            typeService: item.servicePerson?.typeService.typeEntity || '-',
            id: item.servicePerson?.idPerson || '-'
          }));
          //FILTRAR ALIAS SIN REPETIR
          this.nameAlias=this.dataPerson.filter(
            (item, index, self) =>
              item.nameAlias && self.findIndex((t) => t.nameAlias === item.nameAlias) === index
          );
          this.spinner.spinnerOnOff();
          console.log("DATA name : ",this.nameAlias)
      },
      error(error){
        console.error("ERROR: ",error)
        this.spinner.spinnerOnOff();
      }
    })
  }

  optionId:any
  selectOption(event){
    this.optionId=event.value
    console.log("option",this.optionId)
    if(this.optionId.id == '1'){
      this.openDialog();
    } else if(this.optionId.id =='2'){
      this.openDialogType();
    }
  }

  entitySelect:string

  //FUNCION DE BUSQUEDA DE PERSONAS POR TIPO DE ENTIDAD
  selectedEntity(event){
    console.log("BUSQUEDA: ",event.value.master_relativeName)
    this.entitySelect=event.value.master_relativeName.toUpperCase();
    console.log("select",this.entitySelect)
    this.getData(this.entitySelect) //FUNCION DE BUSQUEDA DE PERSONAS POR TIPO DE ENTIDAD
    this.selectedIds = null
  }

  selectAlias(event){
    this.selectedAlias = event.value.nameAlias.toUpperCase();
    console.log("VALOR ALIAS1: ",this.selectedAlias)
    this.spinner.spinnerOnOff();
    this.personService.getPerson(null,this.selectedAlias).subscribe({
      next:(value)=> {
        console.log("V=ALOR ALIAS2: ",value.data)
        //this.reload();
        this.dataPerson = value.data.map(item=>({
          nameAlias:item.name,
          typeService: item.typeEntity,
          zone : item.zone,
          typeDoc:'-',
          status :item.status,
          id:item.idPerson
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
      },
      error(err) {
          this.myToastr.showError('Error al cargar datos..','');
          this.spinner.spinnerOnOff();
          console.error("Error: ",err)
      },
    })
    this.handleSelectedIds(null)

  }

  dataDialog
  selectedHandle(event){
    this.dataDialog=event[0] //id de la persona seleccionada
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogPersonaHabComponent, {
      width:'600px',
      data: {
        id: this.dataDialog,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      // this.animal = result;
      this.dynamic.clearSelection();
    });
  }

  openDialogType(): void {
    const dialogRef = this.dialog.open(DialogPersonEntityTypeComponent, {
      width:'600px',
      data: {
        state: this.typeEntity,
        options: this.optionsType
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed',result);
      // this.animal = result;
      this.dynamic.clearSelection();
    });
  }
  stateOption
  stateType(event){
    console.log("data de dialog: ",event)
    this.stateOption= event.value.master_relativeName
  }
  stateOptionSelect
  stateTypeEntity(event){
    console.log("data de status: ",event)
    this.stateOptionSelect= event.value.master_name
  }

  searchData(){
    // this.spinner.spinnerOnOff();
    if(this.stringFilter == ''){
      this.myToastr.showWarning('Ingrese un valor para la búsqueda','');
      return;
    }
    //VALIDACION PARA ATRIBUTO
    if(this.selectedValue== null){
      this.myToastr.showWarning('Seleccione un atributo para la búsqueda','');
      return;
    }

    this.functionDataCurrent = null;
    this.searchConctactsByFilter(this.pageSize);
  }


  searchConctactsByFilter(pageSize) {
    this.spinner.spinnerOnOff();
    this.clearSelection();
    this.resetIfFunctionChanged(this.searchConctactsByFilter)
    // const filter = this.stringFilter.new.toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trimEnd()
    this.userService.getFilterData(this.stringFilter,this.selectedValue, pageSize, this.pageKey).subscribe({
      next: (contacts) => {
        if(contacts.Items.length<1){
          this.myToastr.showWarning(`No se encontraron coincidencias con: ${this.stringFilter} `,'')
          this.spinner.spinnerOnOff();
          this.cleanSearch();
          return;
        }
        this.updateContacts(contacts.Items, contacts.lastEvaluatedKey);
        console.log('Resultado de searchContactsByFilter' , contacts);
        // this.spinner.spinnerOnOff();
        this.close = true
      },
      error: (err) => {
        this.myToastr.showError(err, 'no se pudo obtener usuarios');
        console.log('spinner oculto error');
        this.spinner.spinnerOnOff();
      },
      complete:()=> {
          this.spinner.spinnerOnOff();
      },
    });
    this.functionDataCurrent = this.searchConctactsByFilter;
    console.log('Valor de filter', this.stringFilter);
  }


  private updateContacts(newContacts, lastEvaluatedKey: any): void {
    this.dataUser = [...this.dataUser, ...newContacts];
    this.pageKey = lastEvaluatedKey || null;
  }
  private clearSelection(){
    this.dynamic.clearSelection();
  }

  private resetIfFunctionChanged(current: any) {
    if (this.functionDataCurrent !== current) {
      this.pageKey = undefined;
      this.dataUser = [];
      // this.lastSelectionOptions = [];
      console.log('Contacts y PageKey limpios');
    }
  }

  cleanSearch(){
    this.stringFilter = ''
    this.getUser();
  }

  updatestate(){
    const data = {
      typeEntity:this.stateOption,
      status:  this.stateOptionSelect
    }
    console.log( "data",data)
    // return
    this.personService.getStateTypePerson(data).subscribe(
      (response) => {
        if(response?.statusCode !==200){
          this.myToastr.showError('Hubo un error al actualizar','')
          console.log("ERROR")
          return
        }
        this.myToastr.showSuccess(response.message,'')
      }
    )
  }

  itemMaster() {

    forkJoin([
      this.masterService.getItemsMasterTable('11'),
      this.masterService.getItemsMasterTable('1')

    ]).subscribe({
      next: ([typeEntity,options]) => {
        this.typeEntity = typeEntity.sort((a, b) => a.master_order - b.master_order);
        this.optionsType = options.sort((a, b) => a.master_order - b.master_order);
        console.log("ENTIDAD: ",this.typeEntity)
        console.log("ENTIDAD2: ",this.optionsType)
      }
    })


  }


  assignUser(){
    console.log("ingreso editar persona:")
    this.router.navigate([`/persons/edit/${this.selectedIds}`])
  }


  editUsers(){
    this.router.navigate([`/persons/user/edit/${this.selectedIds}`])
  }

  onTabChange(event : MatTabChangeEvent){
    console.log('Tab cambiada a:', event.index);
    if(event.index == 1) {
        this.viewData = false
    } else {
      this.viewData = true
    }
  }
  /* momentanemanente comentar luego de ver si funciona el update*/
  /*
  loadPersons(): void {
    this.personService.getPersons().subscribe(data => {
      this.dataPerson = data;
    });
  }
*/

  onToggleChange(event: any): void {
    const { element, checked } = event;
    const dialogRef = this.dialog.open(DialogPersonaStatusComponent, {
      width: '600px',
      data: {
        id: element.id,
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
        this.getPersonData(this.pageSize);
          this.reload();
      }else{
        console.log("filtros definidos");
        this.getPersonInit(); // 🔄 recarga todo después de actualizar segun el filtro
      }
    });
  }

  getPersonInit(){
    console.log("typo:" + this.entitySelect);
    console.log("selectedAlias:" + this.selectedAlias);
    
    this.spinner.spinnerOnOff();
    this.personService.getPerson(this.entitySelect, this.selectedAlias).subscribe({
      next:(value)=> {
          if(value.statusCode !== 200){
            this.myToastr.showError('Error al cargar datos..','');
            this.spinner.spinnerOnOff();
            return
          }
          console.log(value.data)
          //this.reload();
          this.dataPerson = value.data.map(item => ({
            nameAlias: item.servicePerson?.nameAlias || '-',
            zone: item.servicePerson?.zone || '-',
            typeDoc: item.servicePerson?.typeDoc || '-',
            status: item.servicePerson?.status || '-',
            typeService: item.servicePerson?.typeService.typeEntity || '-',
            id: item.servicePerson?.idPerson || '-'
          }));
          //FILTRAR ALIAS SIN REPETIR
          /*
          this.nameAlias=this.dataPerson.filter(
            (item, index, self) =>
              item.nameAlias && self.findIndex((t) => t.nameAlias === item.nameAlias) === index
          );
          */
          this.spinner.spinnerOnOff();
          console.log("DATA name : ",this.nameAlias)
      },
      error(error){
        console.error("ERROR: ",error)
        this.spinner.spinnerOnOff();
      }
    })
  }
}
