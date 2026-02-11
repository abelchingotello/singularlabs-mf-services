import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'app-dialog-service-config',
  templateUrl: './dialog-service-config.component.html',
  styleUrls: ['./dialog-service-config.component.scss']
})
export class DialogServiceConfigComponent implements OnInit {
  public stateMaster: any;
  public Service: string = '';
  public minBalanceDB: number;
  public amountDailyRestriccionDB: number;
  public amountTransactionRestriccionDB: number;
  public paymultipleDB: boolean;
  public paylatestDB: boolean;
  public formConfigService: FormGroup;
  public activedSpinnerSend: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DialogServiceConfigComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private masterService: MasterService,
    private serviceService: ServicesService,
    private fb: FormBuilder,
    private readonly myToastr: MytoastrService,
  ) { }

  ngOnInit(): void {
    console.log('data in ngOnInit', this.data)
    this.Service = (this.data.serviceName)
    if (this.data.serviceAmountDailyRestriccion != 'N/A') this.amountDailyRestriccionDB = Number(this.data.serviceAmountDailyRestriccion)
    if (this.data.serviceAmountTransactionRestriccion != 'N/A') this.amountTransactionRestriccionDB = Number(this.data.serviceAmountTransactionRestriccion)
    if (this.data.servicepay_multiple) this.paymultipleDB = this.data.servicepay_multiple
    if (this.data.servicepay_latest) this.paylatestDB = this.data.servicepay_latest

    this.initialForm();

    if (this.data.servicepay_latest) {
      this.formConfigService.get('paymultiple_active').setValue('paymultiple_latest')
    } else if (this.data.servicepay_multiple) {
      this.formConfigService.get('paymultiple_active').setValue('paymultiple')
    } else {
      this.formConfigService.get('paymultiple_active').setValue('')
    }

    this.masterService.getItemsMasterTable("1").subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });
  }

  initialForm() {
    this.formConfigService = this.fb.group({

      amountDailyRestriccion: [{ value: this.amountDailyRestriccionDB, disabled: false }],
      amountTransactionRestriccion: [{ value: this.amountTransactionRestriccionDB, disabled: false }],
      paymultiple_active: [""],
      btnActualizar: ['']
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  disableDialog() {
    console.log("DESACTIVAR: ")
  }

  updateConfigRestriccion() {
    let updates: any = {};
    let removes: any = {};

    if (this.paymultiple_active === "paymultiple_latest") {
      if (!this.paylatestDB) {
        updates.PAY_LATEST = true
        if (!this.paymultipleDB) updates.PAY_MULTIPLE = true;
      }
    } else if (this.paymultiple_active === "paymultiple") {
      if (this.paymultipleDB) {
        if (this.paylatestDB) {
          updates.PAY_MULTIPLE = true;
          updates.PAY_LATEST = false;
        }
      } else {
        updates.PAY_MULTIPLE = true;
      }
    } else if (this.paymultiple_active == "") {
      if (this.paymultipleDB) {
        updates.PAY_MULTIPLE = false;
        if (this.paylatestDB) updates.PAY_LATEST = false;
      }
    }

    // Restricción diaria
    if (this.amountDailyRestriccion !== this.amountDailyRestriccionDB) {
      if (this.amountDailyRestriccion) {
        updates.AMOUNT_DAILY_RESTRICCION = this.amountDailyRestriccion;
      } else {
        removes.AMOUNT_DAILY_RESTRICCION = true;
      }
    }

    // Restricción por transacción
    if (this.amountTransactionRestriccion !== this.amountTransactionRestriccionDB) {
      if (this.amountTransactionRestriccion) {
        updates.AMOUNT_TRANSACTION_RESTRICCION = this.amountTransactionRestriccion;
      } else {
        removes.AMOUNT_TRANSACTION_RESTRICCION = true;
      }
    }

    // Si no hay cambios, no enviar nada
    if (Object.keys(updates).length === 0 && Object.keys(removes).length === 0) {
      this.myToastr.showWarning('No se detectaron cambios para actualizar', '');
      return;
    }

    let data: any = {};
    if (Object.keys(updates).length > 0) data.updates = updates;
    if (Object.keys(removes).length > 0) data.removes = removes;
    console.log("data", data);

    this.loadingChange(true);

    this.serviceService.updateService(data, this.data.serviceId).subscribe({
      next: (value) => {
        if (value.statusCode == 200) {
          this.myToastr.showSuccess(value.message, '');
          this.loadingChange(false);
          this.dialogRef.close(value.statusCode);
        } else {
          this.myToastr.showWarning(value.messages, '');
          this.loadingChange(false);
        }
      },
      error: (error) => {
        this.loadingChange(false);
        this.myToastr.showError('Error al actualizar la configuración', '');
        console.error(error);
      }
    });
  }

  get amountTransactionRestriccion() {
    return this.formConfigService.get('amountTransactionRestriccion')?.value;
  }
  get amountDailyRestriccion() {
    return this.formConfigService.get('amountDailyRestriccion')?.value;
  }
  get paymultiple_active() {
    return this.formConfigService.get('paymultiple_active')?.value;
  }

  loadingChange(loading: boolean) {
    this.activedSpinnerSend = loading;
  }
}


export interface DialogData {
  serviceName: any,
  serviceId: any,
  serviceAmountTransactionRestriccion: any,
  serviceAmountDailyRestriccion: any,
  servicepay_multiple: any,
  servicepay_latest: any
}
