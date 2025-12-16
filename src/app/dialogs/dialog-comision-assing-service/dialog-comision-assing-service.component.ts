import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    this.stateMaster = this.data.status;

    this.service_name.setValue(this.data.serviceName)
    this.service_type.setValue(this.data.serviceType)
    this.client_name.setValue(this.data.clientName)

    this.service_status.setValue(this.data.serviceStatus)

    this.service_comision_type.setValue(this.data.serviceTypeComission)
    this.service_commission_fixed_value.setValue(this.data.serviceComisionFixed)
    this.service_commission_prc_value.setValue(this.data.serviceComisionPrc)
    this.service_comision_criterio.setValue(this.data.serviceComisionCriterio )
  }

  initializaForms() {
    this.formCommissionClient = this.form.group({
      clientName: [{ value: '', disabled: true }],

      serviceComisionFixed: [''],
      serviceComisionPrc: [''],
      serviceTypeComission: [''],
      serviceComisionCriterio: [''],

      servicetype: [{ value: '', disabled: true }],
      serviceStatus: [''],
      serviceName: [{ value: '', disabled: true }],
    })
  }

  onTypeComissionChange(event) {
    console.log("event: ", event.value)

    if (event.value == this.data.serviceTypeComission || event.value == "MULTIPLE") {
      this.service_commission_fixed_value.setValue(this.data.serviceComisionFixed)
      this.service_commission_prc_value.setValue(this.data.serviceComisionPrc)
    } else {
      this.service_commission_fixed_value.setValue("")
      this.service_commission_prc_value.setValue("")
    }





  }

  updateServic() {

    /*   this.service.updateService(data).subscribe(
         (data) => {
           console.log("respuesta del servicio", data)
           if (data?.statusCode !== 200) {
             this.mytoastr.showError('Error al actualizar', '')
             return
           }
           this.onNoClick();
           this.mytoastr.showSuccess('Actualización correcta', '')
         },
   
       )*/
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
}

export interface DialogData {
  serviceName: String,
  serviceId: String,
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
