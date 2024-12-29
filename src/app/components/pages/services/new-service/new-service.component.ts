import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';

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


    
    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
    

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private readonly activeRouter: ActivatedRoute,
        private mytoastr: MytoastrService,
        private service : ServicesService,
        private masterService: MasterService,
    ) { }

    ngOnInit(): void {
        this.idService = this.activeRouter.snapshot.params['id'];
        this.initializeFormGroup();
        if(this.idService){
            this.titlle = 'Editar Servicio'
            this.getIdService(this.idService);
        }

        this.masterService.getItemsMasterTable('12').subscribe(
            (response: any) => {
                console.log("DEPARTMN",response)
                this.depart = response;
            }
        ),
        
        this.masterService.getItemsMasterTable('14').subscribe(
            (response: any) => {
                console.log("typeservice",response)
                this.typeService = response;
            }
        ),
        
        this.masterService.getItemsMasterTable('11').subscribe(
            (response: any) => {
                console.log("typeClient",response)
                this.typeClient = response;
            }
        ),
        
        this.masterService.getItemsMasterTable('1').subscribe(
            (response: any) => {
                console.log("typeClient",response)
                this.typeStatus = response;
            }
        ),
        
        this.masterService.getItemsMasterTable('15').subscribe(
            (response: any) => {
                console.log("comission",response)
                this.typeComission = response;
            }
        ),
        this.service.getPerson('RECAUDADORA DE SERVICIOS',null).subscribe(
            (response: any) => {
                console.log("recaudadora",response)
                this.typeProClient = response.data;
            }
        ),
        this.service.getPerson('PROVEEDOR',null).subscribe(
            (response: any) => {
                console.log("proveedor",response)
                this.typePro = response.data;
            }
        ),
        console.log("ID: ", this.idService)
    }

    initializeFormGroup() {
        this.serviceForm = this.fb.group({
            //   service_id: ['', Validators.required],
            service_name: ['',Validators.required],
            service_prov: ['',Validators.required],
            service_client: ['',Validators.required],
            service_convenio: ['', Validators.required],
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
            paymentFields_mandatory: ['', Validators.required],
            paymentFields_edit: ['', Validators.required],
        });

    }
    
    saveService() {
        if (!this.idService) {

            console.log("FORMULARIOSERVICIO : ",this.serviceForm.value)
            console.log("FORMULARIOCOMISSION : ",this.comissionForm.value)
            console.log("FORMULARIO-OWM : ",this.ownCommissionForm.value)
            console.log("FORMULARIO-PAYMENTS : ",this.paymentFieldsForm.value)
            // return
            const data = {
                idProvider: this.serviceForm.value.service_prov,// ID ´PROVEEDOR 
                idClient: this.serviceForm.value.service_client, //ID DE RECAUDADORA
                idServiceProv: this.serviceForm.value.service_convenio, //id de convenio
                serviceName: this.serviceForm.value.service_name, //nnomb de servicio
                userRegistration: "DEYNER",
                idTypeService: this.serviceForm.value.service_type.master_idTypeService,
                typeService: this.serviceForm.value.service_type.master_name,//master
                business: this.serviceForm.value.service_type_business, //nombre de negocio
                status: this.serviceForm.value.service_state.master_name,
                zone: this.serviceForm.value.service_zone.master_department,
                collectorName: "",//vacio cuando son clientes // somos proveedores
                commission: { //proveedor
                    fixed: this.comissionForm.value.comission_fixed, //number
                    criterion: this.comissionForm.value.comission_criterion, //number
                    percentage: this.comissionForm.value.comission_percentage, //number decimal
                    type: this.comissionForm.value.comission_type.master_name // fija multiple porcentual
                },
                ownCommission: { //cliente
                    fixed: this.ownCommissionForm.value.ownCommission_fixed, //numeber
                    criterion: this.ownCommissionForm.value.ownCommission_criterion, //number
                    percentage: this.ownCommissionForm.value.ownCommission_percentage, //number
                    type: this.ownCommissionForm.value.ownCommission_type.master_name
                },
                indicators:this.indicatrs,
                additionalPaymentFields: this.dataPayment
            }
            console.log("DATA para registro : ",data)
            // return
            this.service.registerService(data).subscribe({
                next: (response: any) => {
                    console.log("RESPUESTA: ", response)
                }
            })

            this.mytoastr.showSuccess('Guardado correctamente', '')
            // this.router.navigate(['/service'])
        } else {
            this.updateService();
        }
    }
    
    updateService() {
        this.mytoastr.showSuccess('Actualizado correctamente', '')
        this.router.navigate(['/service'])
    }

    indicatorValue(event){
        console.log("EVENTO SELECCIONADO : ",event.value)
    }

    getIdService(idService){
        this.service.getIdServices(idService).subscribe({
            next:(response)=>{
                this.service_name.setValue(response.data[0].name)
                this.service_category.setValue(response.data[0].serviceProvider)
                this.typeService = response.data[0].serviceType
                console.log("typeServicio",this.typeService)
                this.service_type_business.setValue(response.data[0].description)
                // console.log("respuesta de id: ",response)
            }
        })
    }
    register = []
    registerPayment(){
        console.log("FORMULARIO DE PAGO : ",this.paymentFieldsForm.value)
        const data = {
            id: this.paymentFieldsForm.value.paymentFields_id,
            name: this.paymentFieldsForm.value.paymentFields_name,
            fieldType: {
                id: "N",
                name: this.paymentFieldsForm.value.paymentFields_fieldType
            },
            fieldMask: this.paymentFieldsForm.value.paymentFields_fieldMask,
            maximumLength: this.paymentFieldsForm.value.paymentFields_max,
            isMandatory: this.paymentFieldsForm.value.paymentFields_mandatory,
            isEditable: this.paymentFieldsForm.value.paymentFields_edit
        }
        this.register.push(data)
        this.paymentFieldsForm.reset();
        this.dataPayment = [...this.register]
        console.log("DATApayment: ", this.dataPayment)
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

    get service_type_business(){
        return this.serviceForm.get('service_type_business')
    }

    indicatrs = [{
          "id": "PAY_BILL",
          "name": "BASE DE DATOS",
          "isActive": true
        },
        {
          "id": "PAY_PARTIAL",
          "name": "PAGO PARCIAL",
          "isActive": false
        },
        {
          "id": "PAY_CARD",
          "name": "PAGO CON TARJETA",
          "isActive": true
        },
        {
          "id": "FREQUENT_OPERATION",
          "name": "OPERACION FRECUENTE",
          "isActive": true
        },
        {
          "id": "PAY_DEBT_OLDEST",
          "name": "DEUDA MAS ANTIGUA",
          "isActive": true
        },
        {
          "id": "PAY_ONLINE",
          "name": "INTERCONECTADO, PAGO EN LINEA",
          "isActive": false
        },
        {
          "id": "PAY_ACCOUNT",
          "name": "PAGO CON CARGO EN CUENTA",
          "isActive": true
        },
        {
          "id": "PAY_REFLECTED",
          "name": "REFLEJO DE PAGO",
          "isActive": false
        },
        {
          "id": "PAY_AUTOMATIC",
          "name": "DEBITO AUTOMATICO",
          "isActive": false
        },
        {
          "id": "PAY_FIXED_RATE",
          "name": "TASAS FIJAS",
          "isActive": false
        },
        {
          "id": "PAY_CASH",
          "name": "PAGO EN EFECTIVO",
          "isActive": true
        },
        {
          "id": "PAY_CHECK_INTERNAL",
          "name": "PAGO CON CHEQUE PROPIO BANCO",
          "isActive": true
        },
        {
          "id": "PAY_CHECK_EXTERNAL",
          "name": "PAGO CON CHEQUE OTRO BANCO",
          "isActive": true
        },
        {
          "id": "PAY_MULTIPLE_PAYMENTS",
          "name": "ACTUALIZACION MASIVA DE DEUDAS",
          "isActive": false
        }
      ]


}
