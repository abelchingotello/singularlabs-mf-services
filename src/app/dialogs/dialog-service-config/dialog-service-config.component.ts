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
  public formConfigEntity: FormGroup;
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
    console.log('minBalanceDB', this.minBalanceDB)
    this.initialForm();
    /*
    this.formConfigEntity.reset({
      minBalance: '2'
    });*/
    this.masterService.getItemsMasterTable("1").subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });
  }

  initialForm() {
    this.formConfigEntity = this.fb.group({

      amountDailyRestriccion: [{ value: this.amountDailyRestriccionDB, disabled: false }],
      amountTransactionRestriccion: [{ value: this.amountTransactionRestriccionDB, disabled: false }],
      minBalance: [{ value: this.minBalanceDB, disabled: false }],
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


  get minBalance() {
    return this.formConfigEntity.get('minBalance')?.value;
  }
  get amountTransactionRestriccion() {
    return this.formConfigEntity.get('amountTransactionRestriccion')?.value;
  }
  get amountDailyRestriccion() {
    return this.formConfigEntity.get('amountDailyRestriccion')?.value;
  }

  loadingChange(loading: boolean) {
    this.activedSpinnerSend = loading;
  }
}


export interface DialogData {
  serviceName: any,
  serviceId: any,
  serviceAmountTransactionRestriccion: any,
  serviceAmountDailyRestriccion: any
}
