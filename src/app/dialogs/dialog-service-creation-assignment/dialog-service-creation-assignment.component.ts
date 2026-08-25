import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, RequiredValidator, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-dialog-service-creation-assignment',
  templateUrl: './dialog-service-creation-assignment.component.html',
  styleUrls: ['./dialog-service-creation-assignment.component.scss']
})
export class DialogServiceCreationAssignmentComponent implements OnInit {

  public formCommissionClient!: FormGroup;
  public stateMaster: any;
  public activedSpinnerSend: boolean = false;
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

  public modalidadRecaudo: any[] = [];

  constructor(
    private form: FormBuilder,
    public dialogRef: MatDialogRef<DialogServiceCreationAssignmentComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private service: ServicesService,
    private mytoastr: MytoastrService,
    private readonly masterService: MasterService,
  ) { }

async ngOnInit(): Promise<void> {

  this.initializaForms();

  console.log('data', this.data);
  this.serviceId.setValue(this.data.serviceId)
  this.serviceId.disable();
  this.service_name.setValue(this.data.serviceName);
  this.service_convenio.setValue(this.data.serviceIdProv);

  if (typeof this.data.indicators === 'string') {
    try {
      this.data.indicators = JSON.parse(this.data.indicators);
    } catch (e) {
      console.error('Error al parsear indicators:', e);
      this.data.indicators = [];
    }
  }

  // Clonar indicadores
  this.indicatrs = this.data.indicators.map((i: any) => ({ ...i }));

  // Cargar indicadores seleccionados
  const activeIds = this.indicatrs
    .filter(i => i.isActive)
    .map(i => i.id);

  this.service_indicators.setValue(activeIds);

  console.log('service_indicators', this.service_indicators.value);

  // Esperar que cargue modalidades y luego seleccionar la correcta
  await this.listData();
}
  private async listData(): Promise<void> {

    const [modalidadRecaudo] = await firstValueFrom(
      forkJoin([
        this.masterService.getItemsMasterTable('18')
      ])
    );

    this.modalidadRecaudo = modalidadRecaudo.sort(
      (a, b) => a.master_order - b.master_order
    );

    console.log('modalidadRecaudo', this.modalidadRecaudo);

    const baseDatos = this.indicatrs.some(
      i => i.id === 'PAY_BILL' && i.isActive
    );

    const interconectado = this.indicatrs.some(
      i => i.id === 'PAY_ONLINE' && i.isActive
    );

    let modalidad = '-';

    if (baseDatos && interconectado) {
      modalidad = 'PAY_BILL, PAY_ONLINE';
    } else if (baseDatos) {
      modalidad = 'PAY_BILL';
    }

    console.log('modalidad calculada', modalidad);

    console.log(
      'existe en combo?',
      this.modalidadRecaudo.some(
        x => x.master_value === modalidad
      )
    );
    console.log(
      this.modalidadRecaudo.map(x => ({
        nombre: x.master_name,
        valor: JSON.stringify(x.master_value)
      }))
    );
    this.service_collection_type.setValue(modalidad);

    console.log(
      'service_collection_type',
      this.service_collection_type.value
    );
  }

  initializaForms() {
    this.formCommissionClient = this.form.group({
      serviceId: ['', Validators.required],
      service_convenio: ['', Validators.required],
      service_indicators: [[]],
      serviceName: ['', Validators.required],
      service_collection_type: ['', Validators.required],
    });
  }


  updateServic() {
    if (this.formCommissionClient.invalid) {
      this.formCommissionClient.markAllAsTouched();
      return;
    }
    console.log('--- VALIDACIÓN DE CAMBIOS ---');

    // Indicadores originales que llegaron al modal
    const originalIndicators = this.data.indicators
      .filter((i: any) => i.isActive)
      .map((i: any) => i.id)
      .sort();

    // Indicadores actuales
    const currentIndicators = this.indicatrs
      .filter((i: any) => i.isActive)
      .map((i: any) => i.id)
      .sort();

    const sameIndicators =
      JSON.stringify(originalIndicators) ===
      JSON.stringify(currentIndicators);

    const sameConvenio =
      this.service_convenio.value === this.data.serviceIdProv;

    const sameName =
      this.service_name.value === this.data.serviceName;

    // Modalidad original calculada desde los indicadores
    const originalBaseDatos = this.data.indicators.some(
      (i: any) => i.id === 'PAY_BILL' && i.isActive
    );

    const originalInterconectado = this.data.indicators.some(
      (i: any) => i.id === 'PAY_ONLINE' && i.isActive
    );

    let originalModalidad = '-';

    if (originalBaseDatos && originalInterconectado) {
      originalModalidad = 'PAY_BILL, PAY_ONLINE';
    } else if (originalBaseDatos) {
      originalModalidad = 'PAY_BILL';
    }

    const currentModalidad =
      this.service_collection_type.value;

    const sameModalidad =
      currentModalidad === originalModalidad;


    // Si absolutamente nada cambió
    if (
      sameConvenio &&
      sameName &&
      sameIndicators &&
      sameModalidad
    ) {
      this.mytoastr.showWarning('', 'Realice cambios');
      return;
    }

    // Si hubo algún cambio, actualizamos
    const data: any = {
      updateIdServiceProv: true,
      updates: {
        idServiceProv: this.service_convenio.value,
        serviceName: this.service_name.value,
        indicators: this.indicatrs
      },
      removes: ''
    };


    this.loadingChange(true);

    this.service
      .serviceAdvancedDataUpdate(data, this.data.serviceId)
      .subscribe({
        next: (response) => {
          console.log('respuesta del servicio', response);
          this.loadingChange(false);
          this.dialogRef.close('200');
          this.mytoastr.showSuccess('Actualización correcta', '');
        },
        error: (error) => {
          console.error('Error durante la actualizaición:', error);
          this.mytoastr.showError( error.error.messages || 'Error durante la actualización', '');
        }
      });
  }
  
  /**
   * Reglas de negocio (tomadas de import-services.component.ts ->
   * generateIndicators, y confirmadas por el ticket):
   *   - DATA ENTRY            -> Base de Datos: NO, Interconectado: NO
   *   - BASE DE DATOS (BATCH) -> Base de Datos: SI, Interconectado: NO
   *   - INTERCONECTADO        -> Base de Datos: SI, Interconectado: SI
   *
   * Si el Tipo de Servicio no coincide con ninguna de estas modalidades
   * conocidas, no se fuerza nada y el área operativa decide manualmente
   * (evita "adivinar" reglas no confirmadas).
   */
  public applyIndicatorRulesByServiceType(event) {
    const activeIndicators = event.value

    let baseDatos = false;
    let interconectado = false;

    if (activeIndicators.includes('PAY_BILL')) {
      baseDatos = true;
    }
    if (activeIndicators.includes('PAY_ONLINE')) {
      interconectado = true;
    }
    this.indicatrs.forEach(indicator => {
      if (indicator.id === 'PAY_BILL') indicator.isActive = baseDatos;
      if (indicator.id === 'PAY_ONLINE') indicator.isActive = interconectado;
    });

    this.service_indicators?.setValue(
      this.indicatrs.filter(i => i.isActive).map(i => i.id)
    );
  }

  selectIndicat(event: any) {
    const selectedIds = event.value as string[];
    this.indicatrs.forEach(indicator => {
      indicator.isActive = selectedIds.includes(indicator.id);
    });
    console.log('indicatrs',this.indicatrs)
  }


  onNoClick(): void {
    this.dialogRef.close();
  }

  get service_name() {
    return this.formCommissionClient.get('serviceName')
  }
  get serviceId() { return this.formCommissionClient.get('serviceId'); }

  get service_convenio() { return this.formCommissionClient.get('service_convenio'); }
  get service_indicators() { return this.formCommissionClient.get('service_indicators'); }
  get service_collection_type() { return this.formCommissionClient.get('service_collection_type'); }

  loadingChange(loading: boolean) {
    this.activedSpinnerSend = loading;
  }
}

export interface DialogData {
  serviceName: String,
  serviceId: String,
  serviceIdProv: String,
  indicators: any,
}
