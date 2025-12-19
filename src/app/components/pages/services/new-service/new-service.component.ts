import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
        { name: 'ID', attribute: 'id' },
        { name: 'Nombre', attribute: 'name' },
        { name: 'Máscara de campo', attribute: 'fieldMask' },
        { name: 'Longitud', attribute: 'maximumLength' },
        { name: 'Obligatorio', attribute: 'isMandatory' },
        { name: 'Editable', attribute: 'isEditable' },
        {
            name: 'Acciones',
            attribute: '',
            config: {
                type: 'buttonicons',
                actions: [
                    {
                        bgClass: 'red',
                        toolTip: 'Eliminar',
                        icon: 'delete',
                        value: 'remove_additional_payment_fields'
                    }
                ]
            }
        },
    ];

    indicatrs = [
        { id: 'PAY_BILL', name: 'BASE DE DATOS', isActive: false },
        { id: 'PAY_PARTIAL', name: 'PAGO PARCIAL', isActive: false },
        { id: 'PAY_CARD', name: 'PAGO CON TARJETA', isActive: false },
        { id: 'FREQUENT_OPERATION', name: 'OPERACION FRECUENTE', isActive: false },
        { id: 'PAY_DEBT_OLDEST', name: 'DEUDA MAS ANTIGUA', isActive: false },
        { id: 'PAY_ONLINE', name: 'INTERCONECTADO, PAGO EN LINEA', isActive: false },
        { id: 'PAY_ACCOUNT', name: 'PAGO CON CARGO EN CUENTA', isActive: false },
        { id: 'PAY_REFLECTED', name: 'REFLEJO DE PAGO', isActive: false },
        { id: 'PAY_AUTOMATIC', name: 'DEBITO AUTOMATICO', isActive: false },
        { id: 'PAY_FIXED_RATE', name: 'TASAS FIJAS', isActive: false },
        { id: 'PAY_CASH', name: 'PAGO EN EFECTIVO', isActive: false },
        { id: 'PAY_CHECK_INTERNAL', name: 'PAGO CON CHEQUE PROPIO BANCO', isActive: false },
        { id: 'PAY_CHECK_EXTERNAL', name: 'PAGO CON CHEQUE OTRO BANCO', isActive: false },
        { id: 'PAY_MULTIPLE_PAYMENTS', name: 'ACTUALIZACION MASIVA DE DEUDAS', isActive: false },
    ];

    public serviceForm!: FormGroup;
    public comissionForm!: FormGroup;

    public idService: string;
    public idProviderService: string = '';
    public fixcomisionService: number = null;

    public ownCommissionForm!: FormGroup;
    public paymentFieldsForm!: FormGroup;
    public typeService: any;
    public typeClient: any;
    public depart: any;
    public typeStatus: any;
    public typePro: any;
    public typeProClient: any;
    public typeComission: any;
    public titlle: string = 'Nuevo Servicio';
    public pageSize: any = 5;
    public pageKey: any[];
    public dataPayment: any[] = [];
    public functionDataCurrent: (pageSize: any) => any;
    public owncomissionFixed: boolean = true;
    public owncomissionCriterio: boolean = true;
    public owncomissionPercentage: boolean = true;
    public comissionFixed: boolean = true;
    public comissionCriterio: boolean = true;
    public comissionPercentage: boolean = true;
    public currentStep: number = 0;
    public stepsOrig: string[] = [];
    public steps: string[] = ['datos-servicio', 'datos-comisiones', 'datos-pagos'];
    public tab2: boolean = true;
    public tab3: boolean = true;
    public userName: any;
    public register: any[] = [];
    public isMandatory: boolean = false;
    public isEdit: boolean = false;

    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private readonly activeRouter: ActivatedRoute,
        private mytoastr: MytoastrService,
        private service: ServicesService,
        private masterService: MasterService,
        private spinner: SpinnerService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.spinner.spinnerOnOff();
        this.userName = this.authService.getUser();
        this.idService = this.activeRouter.snapshot.params['id'];

        this.initializeFormGroup();
        this.listData();
        this.dataProvRecaud();

        if (this.idService) {
            this.titlle = 'Editar Servicio';
            this.getIdService(this.idService);
        } else {
            this.spinner.spinnerOnOff();
        }

        this.inputMayusName();
    }

    inputMayusName() {
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

    dataProvRecaud() {

        this.service.getPerson('PROVEEDOR', null, true).subscribe({
            next: (data) => {
                this.typePro = data.data;
            },
            error: () => {
                this.mytoastr.showError('Error al obtener datos de proveedor', '');
            },
        });
    }

    listData() {
        forkJoin([
            this.masterService.getItemsMasterTable('12'),
            this.masterService.getItemsMasterTable('14'),
            this.masterService.getItemsMasterTable('11'),
            this.masterService.getItemsMasterTable('1'),
            this.masterService.getItemsMasterTable('15'),
        ]).subscribe({
            next: ([depart, typeService, typeClient, typeStatus, typeComission]) => {
                this.depart = depart.sort((a, b) => a.master_order - b.master_order);
                this.typeService = typeService.sort((a, b) => a.master_order - b.master_order);
                this.typeClient = typeClient.sort((a, b) => a.master_order - b.master_order);
                this.typeStatus = typeStatus.sort((a, b) => a.master_order - b.master_order);
                this.typeComission = typeComission.sort((a, b) => a.master_order - b.master_order);
                if (!this.idService) {
                    this.service_zone.setValue('MULTIDEPARTAMENTAL');
                    this.service_zone.disable();
                }
            },
            error: (error) => {
                console.error('Error loading master table data:', error);
            },
            complete: () => { }
        });
    }

    initializeFormGroup() {
        this.serviceForm = this.fb.group({
            service_name: ['', Validators.required],
            service_prov: ['', Validators.required],
            service_convenio: ['', Validators.required],
            service_type: ['', Validators.required],
            service_type_business: ['', Validators.required],
            service_state: ['', Validators.required],
            service_zone: [''],
            service_indicators: [[]],
        });

        this.comissionForm = this.fb.group({
            comission_fixed: ['', Validators.required],
            comission_criterion: ['', Validators.required],
            comission_percentage: ['', Validators.required],
            comission_type: ['', Validators.required],
        });

        this.ownCommissionForm = this.fb.group({
            ownCommission_fixed: ['', Validators.required],
            ownCommission_criterion: ['', Validators.required],
            ownCommission_percentage: ['', Validators.required],
            ownCommission_type: ['', Validators.required],
        });

        this.paymentFieldsForm = this.fb.group({
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
            const dataServiceForm = this.serviceForm.value;
            const data = {
                idProvider: dataServiceForm.service_prov.idPerson,
                idClient: '00000100',
                idServiceProv: dataServiceForm.service_convenio || this.numConvenio(),
                serviceName: dataServiceForm.service_name,
                userRegistration: this.userName.Username,
                idTypeService: dataServiceForm.service_type,
                typeService: dataServiceForm.service_type,
                business: dataServiceForm.service_type_business,
                status: dataServiceForm.service_state,
                zone: this.service_zone.value,
                collectorName: '',
                typeComission: this.comissionForm.value.comission_type,
                comissionFixed: this.comissionForm.value.comission_fixed,
                comissionCriterion: this.comissionForm.value.comission_criterion,
                comissionPCT: this.comissionForm.value.comission_percentage,
                ownComissionType: this.ownCommissionForm.value.ownCommission_type,
                ownFixedComission: this.ownCommissionForm.value.ownCommission_fixed,
                ownCriterionComission: this.ownCommissionForm.value.ownCommission_criterion,
                ownPCTComission: this.ownCommissionForm.value.ownCommission_percentage,
                indicators: this.indicatrs,
                additionalPaymentFields: this.dataPayment
            };
            this.updateAddService(data, 'Guardado correctamente');
        } else {
            this.updateService();
        }
    }

    updateAddService(data: any, resp: string) {
        this.service.registerService(data).subscribe({
            next: (response: any) => {
                if (response.statusCode !== 200) {
                    this.mytoastr.showSuccess(response.messages, '');
                    return;
                }
                this.mytoastr.showSuccess(resp, '');
            },
            error: (error: any) => {
                console.error('ERROR: ', error);
            },
            complete: () => {
                this.router.navigate(['/service']);
            }
        });
    }

    clickButton(event: any) {
        const { value, element } = event;
        if (value === 'remove_additional_payment_fields') {
            this.remove_additional_payment_fields(element);
        }
    }

    remove_additional_payment_fields(element: any) {
        if (!element || !element.id) {
            this.mytoastr.showWarning('No se pudo identificar el registro a eliminar', '');
            return;
        }
        this.dataPayment = this.dataPayment.filter(item => item.id !== element.id);
        this.register = this.register.filter(item => item.id !== element.id);
    }

    updateService() {
        const data = {
            idProvider: this.idProviderService,
            codProveedor: this.idProviderService,
            idService: this.idService,
            idClient: this.serviceForm.value.service_client,
            idServiceProv: this.serviceForm.value.service_convenio,
            serviceName: this.service_name.value,
            userRegistration: this.userName.Username,
            idTypeService: this.service_type.value,
            typeService: this.service_type.value,
            business: this.service_type_business.value,
            status: this.service_state.value,
            zone: this.serviceForm.value.service_zone,
            collectorName: '',
            ownFixedComission: this.ownCommissionForm.value.ownCommission_fixed,
            ownCriterionComission: this.ownCommissionForm.value.ownCommission_criterion,
            ownPCTComission: this.ownCommissionForm.value.ownCommission_percentage,
            ownComissionType: this.ownCommissionForm.value.ownCommission_type,
            indicators: this.indicatrs,
            additionalPaymentFields: this.dataPayment
        };
        this.updateAddService(data, 'Servicio Actualizado correctamente');
    }

    selectionComissionProv(event: any) {
        if (this.comissionForm.get('comission_fixed')) {
            this.comissionForm.removeControl('comission_fixed');
        }
        if (this.comissionForm.get('comission_criterion')) {
            this.comissionForm.removeControl('comission_criterion');
        }
        if (this.comissionForm.get('comission_percentage')) {
            this.comissionForm.removeControl('comission_percentage');
        }

        if (event.value === 'FIJO') {
            this.comissionForm.addControl('comission_fixed', this.fb.control('', Validators.required));
            this.comissionPercentage = false;
            this.comissionCriterio = false;
            this.comissionFixed = true;
        } else if (event.value === 'PORCENTUAL') {
            this.comissionForm.addControl('comission_percentage', this.fb.control('', Validators.required));
            this.comissionFixed = false;
            this.comissionCriterio = false;
            this.comissionPercentage = true;
        } else if (event.value === 'MULTIPLE') {
            this.comissionForm.addControl('comission_fixed', this.fb.control('', Validators.required));
            this.comissionForm.addControl('comission_criterion', this.fb.control('', Validators.required));
            this.comissionForm.addControl('comission_percentage', this.fb.control('', Validators.required));
            this.comissionCriterio = true;
            this.comissionFixed = true;
            this.comissionPercentage = true;
        }
    }

    getIdService(idService: string) {
        this.service.getIdServices(idService).subscribe({
            next: (response: any) => {
                console.log('Data Service', response);

                this.service_name.setValue(response.data.name);
                this.service_name.disable();

                this.service_convenio.setValue(response.data.id_serviceProv);
                this.service_convenio.disable();

                this.service_prov.setValue(response.data.idProvider);
                this.service_prov.disable();

                this.service_zone.setValue(response.data.zone);

                this.service_type.setValue(
                    this.typeService.find(type => type.master_name === response.data.serviceType.name)
                );
                this.service_type.disable();

                this.service_type_business.setValue(response.data.business);
                this.service_type_business.disable();

                this.service_state.setValue(
                    this.typeStatus.find(status => status.master_name === response.data.status)
                );

                this.dataPayment = response.data['additional-payment-fields'];
                this.indicatrs = response.data.indicators;
                this.idProviderService = response.data.idProvider;
                this.fixcomisionService = response.data.fixedcomission;

                // tipo de comisión proveedor
                this.type_Comission.setValue(response.data.typeComission);
                this.selectionComissionProv({ value: response.data.typeComission });
                this.comission_fixed.setValue(response.data.fixedcomission);
                this.pctcomission.setValue(response.data.pctcomission);
                this.comissioncriterion.setValue(response.data.comissioncriterion);

                // indicadores
                const selectedIds = this.indicatrs.filter(i => i.isActive).map(i => i.id);
                this.serviceForm.get('service_indicators')?.setValue(selectedIds);
            },
            error(err) {
                console.error('ERROR: ', err);
            },
            complete: () => {
                this.spinner.spinnerOnOff();
            },
        });
    }

    registerPayment() {
        if (!this.paymentFieldsForm.valid) {
            this.mytoastr.showWarning('Complete el formulario', '');
            return;
        }
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
        };
        this.register.push(data);
        this.paymentFieldsForm.reset();
        this.dataPayment = [...this.register];
    }

    selectIndicat(event: any) {
        const selectedIds = event.value as string[];
        this.indicatrs.forEach(indicator => {
            indicator.isActive = selectedIds.includes(indicator.id);
        });
    }

    onNext() {
        this.stepsOrig = this.steps;
        this.onNextAdd();
    }

    onNextAdd() {
        if (this.currentStep === 0 && !this.serviceForm.valid) {
            this.mytoastr.showWarning('Complete el formulario', '');
            return;
        }

        if (this.currentStep === 1 && !this.comissionForm.valid) {
            this.mytoastr.showWarning('Complete el formulario', '');
            return;
        }

        if (this.currentStep === 2 && this.dataPayment.length === 0) {
            this.mytoastr.showWarning('Agregue datos a la tabla: ', 'Min 1');
            return;
        }

        if (this.currentStep < this.stepsOrig.length - 1) {
            this.currentStep++;
        }

        if (this.currentStep === 1) {
            this.tab2 = false;
        }

        if (this.currentStep === 2) {
            this.tab3 = false;
        }

        if (this.currentStep === this.stepsOrig.length - 1 && this.dataPayment.length > 0) {
            this.saveService();
        }
    }

    onPrevious() {
        this.currentStep--;
        if (this.currentStep < 0) this.cancel();
    }

    cancel() {
        this.router.navigate(['/service']);
    }

    numConvenio() {
        const date = new Date();
        const anio = date.getFullYear();
        const dia = date.getDate();
        const mes = date.getMonth() + 1;
        const timeLocal = date
            .toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false })
            .replace(/:/g, '');
        return `${anio}${dia}${mes}${timeLocal}`;
    }

    // GETTERS
    get service_name() { return this.serviceForm.get('service_name'); }
    get service_prov() { return this.serviceForm.get('service_prov'); }
    get service_type() { return this.serviceForm.get('service_type'); }
    get service_convenio() { return this.serviceForm.get('service_convenio'); }
    get service_category() { return this.serviceForm.get('service_category'); }
    get service_state() { return this.serviceForm.get('service_state'); }
    get service_zone() { return this.serviceForm.get('service_zone'); }
    get service_type_business() { return this.serviceForm.get('service_type_business'); }

    get ownCommission_fixed() { return this.ownCommissionForm.get('ownCommission_fixed'); }

    get type_Comission() { return this.comissionForm.get('comission_type'); }

    get comission_fixed() { return this.comissionForm.get('comission_fixed'); }
    get pctcomission() { return this.comissionForm.get('comission_percentage'); }
    get comissioncriterion() { return this.comissionForm.get('comission_criterion'); }
}
