import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, RequiredValidator, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-dialog-service-status',
  templateUrl: './dialog-comision-assing-service.component.html',
  styleUrls: ['./dialog-comision-assing-service.component.scss']
})
export class DialogCommissionAssingServiceComponent implements OnInit {

  public formCommissionClient!: FormGroup;
  public stateMaster: any;
  public activedSpinnerSend: boolean = false;

  constructor(
    private form: FormBuilder,
    public dialogRef: MatDialogRef<DialogCommissionAssingServiceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private service: ServicesService,
    private mytoastr: MytoastrService
  ) { }

  ngOnInit(): void {
    this.initializaForms();

    this.changeValidadors(this.data.serviceTypeComission)
    this.stateMaster = this.data.status;

    this.service_name.setValue(this.data.serviceName)
    this.service_type.setValue(this.data.serviceType)
    this.client_name.setValue(this.data.clientName)

    this.service_status.setValue(this.data.serviceStatus)

    this.service_comision_type.setValue(this.data.serviceTypeComission)
    this.service_commission_fixed_value.setValue(this.data.serviceComisionFixed)
    this.service_commission_prc_value.setValue(this.data.serviceComisionPrc)
    this.service_comision_criterio.setValue(this.data.serviceComisionCriterio)

  }

  initializaForms() {
    this.formCommissionClient = this.form.group({
      clientName: [{ value: '', disabled: true }],

      serviceComisionFixed: [''],
      serviceComisionPrc: [''],
      serviceTypeComission: [{ value: '', disabled: true }],
      serviceComisionCriterio: [''],

      servicetype: [{ value: '', disabled: true }],
      serviceStatus: ['', Validators.required],
      serviceName: [{ value: '', disabled: true }],
    })
  }

  changeValidadors(type: String) {
    switch (type) {
      case 'MULTIPLE':
        this.service_comision_criterio.setValidators(Validators.required);
        this.service_commission_prc_value.setValidators(Validators.required);
        this.service_commission_fixed_value.setValidators(Validators.required);
        break;

      case 'FIJO':
        this.service_commission_fixed_value.setValidators(Validators.required);
        this.service_commission_prc_value.clearValidators();
        this.service_comision_criterio.clearValidators();
        break;

      case 'PORCENTUAL':
        this.service_commission_prc_value.setValidators(Validators.required);
        this.service_commission_fixed_value.clearValidators();
        this.service_comision_criterio.clearValidators();
        break;
    }

    this.service_comision_criterio.updateValueAndValidity();
    this.service_commission_prc_value.updateValueAndValidity();
    this.service_commission_fixed_value.updateValueAndValidity();
  }


  onTypeComissionChange(event) {
    console.log("event: ", event.value)
    this.changeValidadors(event.value)
    if (event.value == this.data.serviceTypeComission || event.value == "MULTIPLE") {
      this.service_commission_fixed_value.setValue(this.data.serviceComisionFixed)
      this.service_commission_prc_value.setValue(this.data.serviceComisionPrc)
    } else {
      this.service_commission_fixed_value.setValue("")
      this.service_commission_prc_value.setValue("")
    }

  }

  updateServic() {
    if (
      this.service_comision_type.value == this.data.serviceTypeComission &&
      this.service_commission_fixed_value.value == this.data.serviceComisionFixed &&
      this.service_commission_prc_value.value == this.data.serviceComisionPrc &&
      this.service_comision_criterio.value == this.data.serviceComisionCriterio &&
      this.service_status.value == this.data.serviceStatus
    ) {
      this.mytoastr.showWarning('', 'Realice cambios');
      return;
    }

    this.formCommissionClient.markAllAsTouched();
    if (!this.formCommissionClient.valid) {
      this.mytoastr.showWarning('', 'Complete todos los campos obligatorios');
      return;
    }

    const originalType = this.data.serviceTypeComission;
    const currentType = this.service_comision_type.value;

    let data: any = {
      idProvider: '00000100',
      idClient: this.data.clientId,
      idService: this.data.serviceId,
      idServiceProv: this.data.serviceIdProv,
      updates: {},
      removes: '' // nuevo campo
    };

    // --- UPDATES con tus nombres actuales ---
    data.updates = {
      ownTypeComissionService: currentType
    };

    if (this.service_status.value !== this.data.serviceStatus) {
      data.updates = {
        ...data.updates,
        serviceStatus: this.service_status.value
      };
    }

    switch (currentType) {
      case 'MULTIPLE':
        data.updates = {
          ...data.updates,
          ownFixedComission: this.service_commission_fixed_value.value,
          ownPrcComission: this.service_commission_prc_value.value,
          ownComissionCriterion: this.service_comision_criterio.value
        };
        break;
      case 'FIJO':
        data.updates = {
          ...data.updates,
          ownFixedComission: this.service_commission_fixed_value.value
        };
        break;
      case 'PORCENTUAL':
        data.updates = {
          ...data.updates,
          ownPrcComission: this.service_commission_prc_value.value
        };
        break;
    }

    // --- REMOVES: solo cambian de nombre aquí ---
    const removes: string[] = [];

    // FIJO -> PORCENTUAL: eliminar OWN_FIXED_COMISSION
    if (originalType === 'FIJO' && currentType === 'PORCENTUAL') {
      removes.push('OWN_FIXED_COMISSION');
    }

    // PORCENTUAL -> FIJO: eliminar OWN_PCT_COMISSION
    if (originalType === 'PORCENTUAL' && currentType === 'FIJO') {
      removes.push('OWN_PCT_COMISSION');
    }

    // MULTIPLE -> FIJO: eliminar OWN_PCT_COMISSION y OWN_CRITERION_COMISSION
    if (originalType === 'MULTIPLE' && currentType === 'FIJO') {
      removes.push('OWN_PCT_COMISSION', 'OWN_CRITERION_COMISSION');
    }

    // MULTIPLE -> PORCENTUAL: eliminar OWN_FIXED_COMISSION y OWN_CRITERION_COMISSION
    if (originalType === 'MULTIPLE' && currentType === 'PORCENTUAL') {
      removes.push('OWN_FIXED_COMISSION', 'OWN_CRITERION_COMISSION');
    }

    if (removes.length > 0) {
      data.removes = removes.join(',');
    }

    console.log('Data: ', data);
    this.loadingChange(true);

    this.service.updateComissionService(data).subscribe((response) => {
      console.log('respuesta del servicio', response);
      if (response?.statusCode !== 200) {
        this.mytoastr.showError('Error al actualizar', '');
        this.loadingChange(false);
        this.dialogRef.close('400');
        return;
      }
      this.loadingChange(false);
      this.dialogRef.close('200');
      this.mytoastr.showSuccess('Actualización correcta', '');
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  get service_name() {
    return this.formCommissionClient.get('serviceName')
  }
  get service_type() {
    return this.formCommissionClient.get('servicetype')
  }
  get client_name() {
    return this.formCommissionClient.get('clientName')
  }
  get service_status() {
    return this.formCommissionClient.get('serviceStatus')
  }

  get service_comision_type() {
    return this.formCommissionClient.get('serviceTypeComission')
  }

  get service_commission_fixed_value() {
    return this.formCommissionClient.get('serviceComisionFixed')
  }

  get service_commission_prc_value() {
    return this.formCommissionClient.get('serviceComisionPrc')
  }

  get service_comision_criterio() {
    return this.formCommissionClient.get('serviceComisionCriterio')
  }
  loadingChange(loading: boolean){
    this.activedSpinnerSend = loading;
  }
}

export interface DialogData {
  serviceName: String,
  serviceId: String,
  serviceIdProv: String,
  serviceStatus: String,
  serviceComisionFixed: Number,
  serviceComisionPrc: Number,
  serviceTypeComission: String,
  serviceType: String,
  clientName: String,
  clientId: String,
  status: String,
  serviceComisionCriterio: Number
}
