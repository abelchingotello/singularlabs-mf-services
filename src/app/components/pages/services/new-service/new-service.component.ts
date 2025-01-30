import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
    selector: 'uni-new-service',
    templateUrl: './new-service.component.html',
    styleUrls: ['./new-service.component.scss']
})
export class NewServiceComponent implements OnInit {


    public columns: any[] = [
        { 'name': 'ID', 'attribute': 'id' },
        { 'name': 'Nombre', 'attribute': 'name' },
        // { 'name': 'Tipo de campo', 'attribute': 'paymentFields_fieldType'},
        { 'name': 'Máscara de campo', 'attribute': 'fieldMask'},
        { 'name': 'Longitud', 'attribute': 'maximumLength'},
        { 'name': 'Obligatorio', 'attribute': 'isMandatory'},
        { 'name': 'Editable', 'attribute': 'isEditable'},
    ];

    indicatrs = [
        { id: "PAY_BILL", name: "BASE DE DATOS", isActive: false },
        { id: "PAY_PARTIAL", name: "PAGO PARCIAL", isActive: false },
        { id: "PAY_CARD", name: "PAGO CON TARJETA", isActive: false },
        { id: "FREQUENT_OPERATION", name: "OPERACION FRECUENTE", isActive: false },
        { id: "PAY_DEBT_OLDEST", name: "DEUDA MAS ANTIGUA", isActive: false },
        { id: "PAY_ONLINE", name: "INTERCONECTADO, PAGO EN LINEA", isActive: false },
        { id: "PAY_ACCOUNT", name: "PAGO CON CARGO EN CUENTA", isActive: false },
        { id: "PAY_REFLECTED", name: "REFLEJO DE PAGO", isActive: false },
        { id: "PAY_AUTOMATIC", name: "DEBITO AUTOMATICO", isActive: false },
        { id: "PAY_FIXED_RATE", name: "TASAS FIJAS", isActive: false },
        { id: "PAY_CASH", name: "PAGO EN EFECTIVO", isActive: false },
        { id: "PAY_CHECK_INTERNAL", name: "PAGO CON CHEQUE PROPIO BANCO", isActive: false },
        { id: "PAY_CHECK_EXTERNAL", name: "PAGO CON CHEQUE OTRO BANCO", isActive: false },
        { id: "PAY_MULTIPLE_PAYMENTS", name: "ACTUALIZACION MASIVA DE DEUDAS", isActive: false },
      ];

    public serviceForm!: FormGroup;
    public comissionForm!: FormGroup;
    public ownCommissionForm!: FormGroup;
    public paymentFieldsForm!: FormGroup;
    public idService: string;
    public typeService:any ;
    public typeClient:any ;
    public depart :any;
    public typeStatus :any;
    public typePro :any;
    public typeProClient :any;
    public typeComission :any;
    public titlle : string = 'Nuevo Servicio';
    public pageSize: any = 5;
    public pageKey: any[];
    public dataPayment = [];
    public functionDataCurrent: (pageSize: any) => any;
    public editAsigService : boolean = true
    public editClient : boolean = false
    public owncomissionFixed : boolean = true
    public owncomissionCriterio : boolean = true
    public owncomissionPercentage : boolean = true
    public comissionFixed : boolean = true
    public comissionCriterio : boolean = true
    public comissionPercentage : boolean = true
    public currentStep : number = 0;
    public stepsOrig = []
    public steps: string[] = ['datos-servicio', 'datos-comisiones', 'datos-pagos'];
    public stepsAsig: string[] = ['datos-servicio', 'datos-comisiones'];
    public disableTab3: boolean = true
    public tab2: boolean = true
    public tab3: boolean = true
    public userName : any;
    public register = [];
    public isMandatory : boolean = false
    public isEdit: boolean = false

    
    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
    

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private readonly activeRouter: ActivatedRoute,
        private mytoastr: MytoastrService,
        private service : ServicesService,
        private masterService: MasterService,
        private spinner : SpinnerService,
        private authService : AuthService
    ) { }

    ngOnInit(): void {
        this.userName= this.authService.getUser();
        console.log("userid: ",this.userName.Username)
        this.idService = this.activeRouter.snapshot.params['id'];
        this.initializeFormGroup();
        this.listData();
        this.dataProvRecaud();

        if(this.idService){
            this.serviceForm.removeControl('service_prov');
            this.disableTab3 = false
            this.titlle = 'Asignar Servicio'
            this.editAsigService = false
            this.editClient = true
            setTimeout(() => { 
                this.getIdService(this.idService)
            },1500);
        } else {
            this.serviceForm.removeControl('service_client');
        }

        this.inputMayusName();

    }

    inputMayusName(){
        this.service_name?.valueChanges.subscribe(value => {
            if (value) {
                this.service_name?.setValue(value.toUpperCase(), { emitEvent: false });
            }
        });

        this.service_type_business?.valueChanges.subscribe(value => {
            if (value) {
                this.service_type_business?.setValue(value.toUpperCase(), { emitEvent: false });
            }
        });
    }

    dataProvRecaud(){
        
        this.service.getPerson('RECAUDADORA DE SERVICIOS',null).subscribe({
            next: (data) => {
                // this.spinner.spinnerOnOff();
                this.typeProClient = data.data
            },
            error: (error) => {
                this.mytoastr.showError('Error al obtener datos de Recaudadora','')
                console.error('ERROR',error)
            }
        })
        this.service.getPerson('PROVEEDOR',null).subscribe({
            next: (data) => {
                // this.spinner.spinnerOnOff();
                this.typePro = data.data;
            },
            error: (error) => {
                this.mytoastr.showError('Error al obtener datos de proveedor','')
                console.error('ERROR',error)
            },
        })
    }

    listData() {
        this.spinner.spinnerOnOff();
        forkJoin([
            this.masterService.getItemsMasterTable('12'), // depar
            this.masterService.getItemsMasterTable('14'), // tipoServic
            this.masterService.getItemsMasterTable('11'),  // tipoClient
            this.masterService.getItemsMasterTable('1'), // tipoStatus
            this.masterService.getItemsMasterTable('15'), // tipoComission
        ]).subscribe({
            next: ([depart, typeService, typeClient, typeStatus, typeComission]) => {
                this.depart = depart.sort((a, b) => a.master_order - b.master_order);
                this.typeService = typeService.sort((a, b) => a.master_order - b.master_order);
                this.typeClient = typeClient.sort((a, b) => a.master_order - b.master_order);
                this.typeStatus = typeStatus.sort((a, b) => a.master_order - b.master_order);
                this.typeComission = typeComission.sort((a, b) => a.master_order - b.master_order);
                console.log("TIPO SERIVICIO:",this.typeService)
                console.log("DEPART: ", this.depart)
                if (!this.idService) {
                    this.service_zone.setValue(
                        this.depart.find(zone => zone.master_department === 'MULTIDEPARTAMENTAL')
                    )
                    this.service_zone.disable();
                }
            },
            error: (error) => {
                console.error("Error loading master table data:", error);
                this.spinner.spinnerOnOff();
            },
            complete:()=> {
                this.spinner.spinnerOnOff();
            }

        });
    }

    initializeFormGroup() {
        this.serviceForm = this.fb.group({
            //   service_id: ['', Validators.required],
            service_name: ['',Validators.required],
            service_prov: ['',Validators.required],
            service_client: ['', Validators.required],
            service_convenio: [''],
            service_type: ['', Validators.required],
            service_type_business: ['', Validators.required],
            service_state: ['', Validators.required],
            service_zone: ['', Validators.required],
        });
        
        this.comissionForm = this.fb.group({
            //   service_id: ['', Validators.required],
            comission_fixed: ['',Validators.required],
            comission_criterion: ['',Validators.required],
            comission_percentage: ['',Validators.required],
            comission_type: ['',Validators.required],
        });

        this.ownCommissionForm = this.fb.group({
            //   service_id: ['', Validators.required],
            ownCommission_fixed: ['',Validators.required],
            ownCommission_criterion: ['',Validators.required],
            ownCommission_percentage: ['',Validators.required],
            ownCommission_type: ['',Validators.required],
        });

        this.paymentFieldsForm = this.fb.group({
            //   service_id: ['', Validators.required],
            paymentFields_id: ['', Validators.required],
            paymentFields_name: ['', Validators.required],
            paymentFields_fieldType: ['', Validators.required],
            paymentFields_fieldMask: ['', Validators.required],
            paymentFields_max: ['', Validators.required],
            paymentFields_mandatory: this.isMandatory,
            paymentFields_edit: this.isEdit,
        });

    }
    
    saveService() {
        if (!this.idService) {

            console.log("FORMULARIOSERVICIO : ",this.serviceForm.value)
            console.log("FORMULARIOCOMISSION : ",this.comissionForm.value)
            console.log("FORMULARIO-OWM : ",this.ownCommissionForm.value)
            console.log("FORMULARIO-PAYMENTS : ",this.paymentFieldsForm.value)
            const dataServiceForm = this.serviceForm.value
            // return
            const data = {
                idProvider: dataServiceForm.service_prov.idPerson,// ID ´PROVEEDOR 
                idClient: '00000100', //ID DE RECAUDADORA
                idServiceProv: dataServiceForm.service_convenio || this.numConvenio(), //id de convenio
                serviceName: dataServiceForm.service_name, //nnomb de servicio
                userRegistration: this.userName.Username,
                idTypeService: dataServiceForm.service_type.master_idTypeService,
                typeService: dataServiceForm.service_type.master_name,//master
                business: dataServiceForm.service_type_business, //nombre de negocio
                status: dataServiceForm.service_state.master_name,
                zone: this.service_zone.value.master_department,
                collectorName: "",//vacio cuando son clientes // somos proveedores
                typeComission: this.comissionForm.value.comission_type.master_name,
                comissionFixed: this.comissionForm.value.comission_fixed,
                comissionCriterion: this.comissionForm.value.comission_criterion,
                comissionPCT: this.comissionForm.value.comission_percentage,
                ownComissionType: this.ownCommissionForm.value.ownCommission_type.master_name,
                ownFixedComission: this.ownCommissionForm.value.ownCommission_fixed,
                ownCriterionComission: this.ownCommissionForm.value.ownCommission_criterion,
                ownPCTComission: this.ownCommissionForm.value.ownCommission_percentage,
                indicators: this.indicatrs,
                additionalPaymentFields: this.dataPayment
            }
            console.log("DATA para registro : ",data)
            // console.log("DATA DE PAGOS : ",this.dataPayment)
            // return
            this.updateAddService(data,'Guardado correctamente');

            
            // this.router.navigate(['/service'])
        } else {
            this.updateService();
        }
    }

    updateAddService(data:any,resp:string){
        this.spinner.spinnerOnOff();
        this.service.registerService(data).subscribe({
            next: (response: any) => {
                console.log("RESPUESTA: ", response)
                if (response.statusCode !== 200) {
                    this.mytoastr.showSuccess(response.messages, '')
                    return
                }
                this.mytoastr.showSuccess(resp, '')
            },
            error: (error: any) => {
                console.error("ERROR: ", error)
            },
            complete :()=>{
                this.spinner.spinnerOnOff();
                this.router.navigate(['/service'])
            }
        })
    }
    
    updateService() {
        console.log("NAME DEL SERVICIO: ",this.service_name.value)
        const data = {
                idProvider: '00000100',// ID ´PROVEEDOR 
                idClient: this.serviceForm.value.service_client, //ID DE RECAUDADORA
                idServiceProv: this.serviceForm.value.service_convenio, //id de convenio
                serviceName: this.service_name.value, //nnomb de servicio
                userRegistration: this.userName.Username,
                idTypeService: this.service_type.value.master_idTypeService,
                typeService: this.service_type.value.master_name,//master
                business: this.service_type_business.value, //nombre de negocio
                status: this.service_state.value.master_name,
                zone: this.serviceForm.value.service_zone.master_department,
                collectorName: "",//vacio cuando son clientes // somos proveedores
                ownFixedComission: this.ownCommissionForm.value.ownCommission_fixed, //numeber
                ownCriterionComission: this.ownCommissionForm.value.ownCommission_criterion, //number
                ownPCTComission: this.ownCommissionForm.value.ownCommission_percentage, //number
                ownComissionType: this.ownCommissionForm.value.ownCommission_type.master_name,
                indicators:this.indicatrs,
                additionalPaymentFields: this.dataPayment
        }
        
        console.log("DATA PARA ACRTUALIZAR :",data)
        // return
        this.updateAddService(data,'Asignado correctamente');
        // this.mytoastr.showSuccess('Actualizado correctamente', '')
        // this.router.navigate(['/service'])
    }

    selectionComission(event){
        console.log("EVENTO DE SELÑECCION: ",event.value)
        if(event.value.master_name == 'FIJO'){
            this.ownCommissionForm.removeControl('ownCommission_percentage');
            this.ownCommissionForm.removeControl('ownCommission_criterion');
            this.owncomissionPercentage = false
            this.owncomissionCriterio = false
            this.owncomissionFixed = true
        } else if(event.value.master_name == 'PORCENTUAL'){
            this.ownCommissionForm.removeControl('ownCommission_fixed');
            this.owncomissionFixed = false
            this.owncomissionCriterio = true
            this.owncomissionPercentage = true
        } else if (event.value.master_name == 'MULTIPLE'){
            this.owncomissionCriterio = true
            this.owncomissionFixed = true
            this.owncomissionPercentage = true
        }
    }

    selectionComissionProv(event){
        console.log("EVENTO DE SELÑECCION: ",event.value)
        if(event.value.master_name == 'FIJO'){
            this.comissionForm.removeControl('comission_percentage');
            this.comissionForm.removeControl('comission_criterion');
            this.comissionPercentage = false
            this.comissionCriterio = false
            this.comissionFixed = true
        } else if(event.value.master_name == 'PORCENTUAL'){
            this.comissionForm.removeControl('comission_fixed');
            this.comissionFixed = false
            this.comissionCriterio = true
            this.comissionPercentage = true
        } else if (event.value.master_name == 'MULTIPLE'){
            this.comissionCriterio = true
            this.comissionFixed = true
            this.comissionPercentage = true
        }
    }

    indicatorValue(event){
        console.log("EVENTO SELECCIONADO : ",event.value)
    }

    getIdService(idService){
        this.spinner.spinnerOnOff();
        this.service.getIdServices(idService).subscribe({
            next:(response)=>{
                this.service_name.setValue(response.data[0].name)
                this.service_name.disable();
                this.service_type.setValue(
                    this.typeService.find(type => type.master_name === response.data[0].serviceType.name)
                );
                console.log("typeService: ",this.service_type.value)
                this.typeService.some((value)=>{
                    value.master_name === response.data[0].serviceType.name
                })
                
                console.log("service_type: ",this.service_type.value)
                this.service_type.disable();
                this.service_type_business.setValue(response.data[0].business)
                this.service_type_business.disable();
                this.service_state.setValue(
                    this.typeStatus.find(status => status.master_name === response.data[0].status)
                );
                this.dataPayment = response.data[0]["additional-payment-fields"]
                this.indicatrs = response.data[0].indicators

                console.log("INDICADORES: ",this.indicatrs)
            },
            error(err) {
                console.error("ERROR: ",err)
            },
            complete:()=> {
                this.spinner.spinnerOnOff();
            },
        })
    }

    registerPayment(){
        if(!this.paymentFieldsForm.valid){
            this.mytoastr.showWarning('Complete el formulario','')
            return
        }
        console.log("FORMULARIO DE PAGO : ",this.paymentFieldsForm.value)
        const data = {
            id: this.paymentFieldsForm.value.paymentFields_id,
            name: this.paymentFieldsForm.value.paymentFields_name,
            fieldType: {
                id: this.paymentFieldsForm.value.paymentFields_fieldType.charAt(0),
                name: this.paymentFieldsForm.value.paymentFields_fieldType
            },
            fieldMask: this.paymentFieldsForm.value.paymentFields_fieldMask,
            maximumLength: this.paymentFieldsForm.value.paymentFields_max,
            isMandatory: this.paymentFieldsForm.value.paymentFields_mandatory || this.isMandatory,
            isEditable: this.paymentFieldsForm.value.paymentFields_edit || this.isEdit
        }
        this.register.push(data)
        this.paymentFieldsForm.reset();
        this.dataPayment = [...this.register]
        console.log("DATApayment: ", this.dataPayment)
    }

    selectIndicat(event){
        const selectedIds = event.value.map((indicator: any) => indicator.id);
        // console.log("SELECTEDID: ",selectedIds)
        // Actualiza isActive basado en las selecciones
        this.indicatrs.forEach(indicator => {
            indicator.isActive = selectedIds.includes(indicator.id);
        });
    
        // console.log("Indicadores actualizados:", this.indicatrs);
    }

    onNext(){
        if(this.idService){
            this.stepsOrig = this.stepsAsig
            this.onNextAsign();
        } else {
            this.stepsOrig = this.steps
            this.onNextAdd();
        }
    }

    onNextAdd() {
        // Validar el formulario del paso actual
        if (this.currentStep === 0 && !this.serviceForm.valid) {
            this.mytoastr.showWarning('Complete el formulario','')
            return;
        }

        if (this.currentStep === 1 && !this.comissionForm.valid) {
                this.mytoastr.showWarning('Complete el formulario','')
                return;
        }

        if (this.currentStep === 2 && this.dataPayment.length == 0) {
                this.mytoastr.showWarning('Agregue datos a la tabla: ', 'Min 1')
                return;
        }

        if (this.currentStep < this.stepsOrig.length-1) {
            this.currentStep++;
        } 

        // Habilitar pestañas subsiguientes
        if (this.currentStep === 1) {
            this.tab2 = false;
        }

        if (this.currentStep === 2) {
                this.tab3 = false;
        }

        if(this.currentStep === this.stepsOrig.length-1 && this.dataPayment.length>0){
            // console.log("INGRESO PARA REGISTRARSE-Add")
            this.saveService();
        }
        console.log("currentStep: ",this.currentStep)

    }

    onNextAsign() {
        // Validar el paso actual
        if (!this.validateCurrentStep()) {
            return;
        }

        // Si la validación es exitosa, proceder al siguiente paso
        if (this.currentStep < this.stepsOrig.length - 1) {
            this.currentStep++;
            this.updateTabVisibility();
        } else {
            this.finalizeForm();
        }
    }

    private updateTabVisibility() {
        if (this.currentStep === 1) {
            this.tab2 = false;
        }
    }


    private finalizeForm() {
        // Asegurarse de que todos los formularios estén válidos antes de finalizar
        if (this.serviceForm.valid && this.ownCommissionForm.valid) {
            // Aquí va tu lógica para guardar/enviar el formulario
            console.log('Formulario completado y válido');
            this.saveService();
        } else {
            this.mytoastr.showWarning('Complete todos los formularios antes de finalizar', '');
        }
    }

    // onNextAsign() {
    //     // Validar el formulario del paso actual
    //     if (this.currentStep === 0 && !this.serviceForm.valid) {
    //         this.mytoastr.showWarning('Complete el formulario','')
    //         return;
    //     }

    //     if (this.currentStep === 1 && !this.ownCommissionForm.valid) {
    //         this.mytoastr.showWarning('Complete el formulario Com.Client','')
    //         return;
    //     }

    //     if (this.currentStep < this.stepsOrig.length-1) {
    //         this.currentStep++;
    //     } 

    //     // Habilitar pestañas subsiguientes
    //     if (this.currentStep === 1) {
    //         this.tab2 = false;
    //     }
        
    //     if(this.currentStep === this.stepsOrig.length-1){
    //         // console.log("INGRESO PARA REGISTRARSE-AsIG")
    //         // this.saveService();
    //     }
    //     console.log("currentStep: ",this.currentStep)

    // }


    private validateCurrentStep(): boolean {
        switch (this.currentStep) {
            case 0:
                if (!this.serviceForm.valid) {
                    this.mytoastr.showWarning('Complete el formulario', '');
                    return false;
                }
                return true;

            case 1:
                if (!this.ownCommissionForm.valid) {
                    this.mytoastr.showWarning('Complete el formulario Com.Client', '');
                    return false;
                }
                return true;

            default:
                return true;
        }
    }

    onPrevious() {
        this.currentStep--;
        console.log("NEGATIVO: ", this.currentStep)
        if (this.currentStep < 0) this.cancel();
    }

    cancel(){
        this.router.navigate(['/service'])
    }

    numConvenio(){
        const date = new Date();
        const anio = date.getFullYear(); // Obtiene el año
        const dia = date.getDate();
        const mes = date.getMonth() + 1;
        const timeLocal = date
        .toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false }) // Formato 24 horas
        .replace(/:/g, ""); // Quita los dos puntos
        // console.log("TIEMPO LOCAL: ",anio)
        // console.log("TIEMPO LOCAL: ",date)
        return `${anio}${dia}${mes}${timeLocal}`;
    }


    get service_name(){
        return this.serviceForm.get('service_name')
    }

    get service_type(){
        return this.serviceForm.get('service_type')
    }

    get service_category(){
        return this.serviceForm.get('service_category')
    }

    get service_state(){
        return this.serviceForm.get('service_state')
    }

    get service_zone(){
        return this.serviceForm.get('service_zone')
    }

    get service_type_business(){
        return this.serviceForm.get('service_type_business')
    }

    get ownCommission_fixed(){
        return this.ownCommissionForm.get('ownCommission_fixed')
    }

}
