import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { PersonService } from 'src/app/services/person.service';

/**
 * Catálogo de tipos de dato "amigables" para el área operativa.
 *
 * El mapeo a valores técnicos (fieldTypeId / fieldMask),6
 * Ahí se confirma que:
 *   - fieldMask SIEMPRE es 'D' para campos de referencia estándar
 *     (independiente del tipo de dato).
 *   - 'N' se usa como id de tipo cuando el dato es NUMERICO.
 *   - Cualquier otro valor se trata como ALFANUMERICO.
 *
 */
export interface PaymentFieldDataType {
  key: string;          // valor interno del <mat-select>
  label: string;         // texto amigable que ve el área operativa
  fieldTypeId: string;   // código técnico que espera el backend ('A', 'N')
  fieldTypeName: string; // nombre técnico completo
  fieldMask: string;     // máscara técnica asociada
}

@Component({
  selector: 'uni-new-service',
  templateUrl: './new-service.component.html',
  styleUrls: ['./new-service.component.scss']
})
export class NewServiceComponent implements OnInit {
  public originalFormData: any = null;
  public originalExtras: any = null;
  public originalBodyBase: any = null;
  public originalIdServiceProv: string | null = null;

  // Catálogo de tipos de dato amigables para "Datos Pagos-Adicionales".
  // Solo ALFANUMERICO y NUMERICO están confirmados contra el importador.
  public dataTypeCatalog: PaymentFieldDataType[] = [
    { key: 'ALFANUMERICO', label: 'Alfanumérico (letras y números)', fieldTypeId: 'A', fieldTypeName: 'ALFANUMERICO', fieldMask: 'D' },
    { key: 'NUMERICO', label: 'Numérico (solo números)', fieldTypeId: 'N', fieldTypeName: 'NUMERICO', fieldMask: 'D' },
  ];

  public columns: any[] = [
    { name: 'ID', attribute: 'id' },
    { name: 'Nombre', attribute: 'name' },
    { name: 'Tipo de dato', attribute: 'dataTypeLabel' },
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

  public modalidadRecaudo: any[] = [];

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
  public comissionRange: boolean = false;
  public comissionPercentage: boolean = true;
  public currentStep: number = 0;
  public steps: string[] = ['datos-servicio', 'datos-comisiones', 'datos-pagos'];
  public tab2: boolean = true;
  public tab3: boolean = true;
  public userName: any;
  public register: any[] = [];
  public isMandatory: boolean = false;
  public isEdit: boolean = false;

  // Evita que la automatización de indicadores pise los valores ya guardados
  // mientras se está cargando un servicio existente para edición.
  private loadingExistingService: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly activeRouter: ActivatedRoute,
    private readonly mytoastr: MytoastrService,
    private readonly service: ServicesService,
    private readonly masterService: MasterService,
    private readonly spinner: SpinnerService,
    private readonly authService: AuthService,
    private readonly personService: PersonService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.spinner.spinnerOnOff();
    this.userName = this.authService.getUser();
    this.idService = this.activeRouter.snapshot.params['id'];

    this.initializeFormGroup();
    await this.listData();

    if (this.idService) {
      this.titlle = 'Editar Servicio';
      await this.getIdService(this.idService);
      this.takeOriginalSnapshot();
    } else {
      this.service_zone.setValue('MULTIDEPARTAMENTAL');
      this.service_zone.disable();
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

    let baseDatos: boolean;
    let interconectado: boolean;

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

  private async listData(): Promise<void> {
    const [personData, depart, typeService, typeClient, typeStatus, typeComission, modalidadRecaudo] =
      await firstValueFrom(
        forkJoin([
          this.personService.getPerson('PROVEEDOR', null, true),
          this.masterService.getItemsMasterTable('12'),
          this.masterService.getItemsMasterTable('14'),
          this.masterService.getItemsMasterTable('11'),
          this.masterService.getItemsMasterTable('1'),
          this.masterService.getItemsMasterTable('15'),
          this.masterService.getItemsMasterTable('18'),
        ])
      );

    this.typePro = personData.data;
    this.depart = depart.sort((a, b) => a.master_order - b.master_order);
    this.typeService = typeService.sort((a, b) => a.master_order - b.master_order);
    this.typeClient = typeClient.sort((a, b) => a.master_order - b.master_order);
    this.typeStatus = typeStatus.sort((a, b) => a.master_order - b.master_order);
    this.typeComission = typeComission.sort((a, b) => a.master_order - b.master_order);
    this.modalidadRecaudo = modalidadRecaudo.sort((a, b) => a.master_order - b.master_order);
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
      service_collection_type: ['', Validators.required]
    });

    this.comissionForm = this.fb.group({
      comission_fixed: ['', Validators.required],
      comission_criterion: ['', Validators.required],
      comission_percentage: ['', Validators.required],
      comission_range_lower: ['', Validators.required],
      comission_range_upper: ['', Validators.required],
      comission_type: ['', Validators.required],
    });

    this.paymentFieldsForm = this.fb.group({
      paymentFields_id: ['', Validators.required],
      paymentFields_name: ['', Validators.required],
      paymentFields_dataType: ['', Validators.required],
      paymentFields_max: ['', Validators.required],
      paymentFields_mandatory: this.isMandatory,
      paymentFields_edit: this.isEdit,
    });
  }

  private takeOriginalSnapshot() {
    const serviceRaw = this.serviceForm.getRawValue();
    const comissionRaw = this.comissionForm.getRawValue();

    this.originalFormData = {
      service: serviceRaw,
      comission: comissionRaw
    };

    this.originalExtras = {
      indicators: JSON.parse(JSON.stringify(this.indicatrs)),
      additionalPaymentFields: JSON.parse(JSON.stringify(this.dataPayment))
    };
  }

  saveService() {
    if (!this.serviceForm.valid) {
      this.mytoastr.showWarning('Complete los datos de servicio', '');
      this.currentStep = 0;
      return;
    }
    if (!this.comissionForm.valid) {
      this.mytoastr.showWarning('Complete los datos de comisiones', '');
      this.currentStep = 1;
      return;
    }
    if (this.dataPayment.length === 0) {
      this.mytoastr.showWarning('Agregue al menos un pago adicional', '');
      this.currentStep = 2;
      return;
    }

    const serviceRaw = this.serviceForm.getRawValue();
    const comissionRaw = this.comissionForm.getRawValue();

    const bodyBase = {
      idProvider: serviceRaw.service_prov,
      idClient: '00000100',
      idServiceProv: serviceRaw.service_convenio || this.originalIdServiceProv || this.numConvenio(),
      serviceName: serviceRaw.service_name,
      userRegistration: this.userName.Username,
      idTypeService: String(serviceRaw.service_type.master_idTypeService),
      typeService: serviceRaw.service_type.master_name,
      business: serviceRaw.service_type_business,
      status: serviceRaw.service_state,
      zone: serviceRaw.service_zone ?? null,
      collectorName: '',
      typeComission: comissionRaw.comission_type,
      comissionFixed: comissionRaw.comission_fixed,
      comissionRange: comissionRaw.comission_range_lower != null
        ? JSON.stringify({
          lower: comissionRaw.comission_range_lower,
          upper: comissionRaw.comission_range_upper
        })
        : this.originalBodyBase?.comissionRange ?? null,
      comissionCriterion: comissionRaw.comission_criterion,
      comissionPCT: comissionRaw.comission_percentage,
      indicators: this.indicatrs,
      additionalPaymentFields: this.buildAdditionalPaymentFieldsPayload()
    };

    if (!this.idService) {
      this.AddService(bodyBase);
    } else {
      this.updateService(bodyBase, serviceRaw, comissionRaw);
    }
  }

  /**
   * Arma el arreglo de additionalPaymentFields exactamente con la misma
   * forma que ya espera el backend (id, name, fieldType{id,name}, fieldMask,
   * maximumLength, isMandatory, isEditable). Las propiedades dataTypeKey /
   * dataTypeLabel son solo para uso interno del frontend (mostrar el tipo
   * amigable en la tabla) y NO se envían al backend.
   */
  private buildAdditionalPaymentFieldsPayload(): any[] {
    return this.dataPayment.map(({ dataTypeKey, dataTypeLabel, ...backendField }) => backendField);
  }

  updateService(bodyBase: any, serviceRaw: any, comissionRaw: any) {
    const hasFormChanges = this.hasDiff(
      { service: serviceRaw, comission: comissionRaw },
      this.originalFormData
    );
    const hasExtraChanges = this.hasDiff(
      { indicators: this.indicatrs, additionalPaymentFields: this.dataPayment },
      this.originalExtras
    );

    if (!hasFormChanges && !hasExtraChanges) {
      this.mytoastr.showWarning('', 'No se identificaron cambios');
      return;
    }

    const changedBody = this.getBodyDiff(bodyBase, this.originalBodyBase);
    changedBody.userRegistration = this.userName.Username;

    const removes = this.getCommissionRemoves(
      this.originalBodyBase?.typeComission,
      comissionRaw.comission_type
    );

    console.log("changedBody: ", changedBody);
    console.log("removes: ", removes);

    const dataUpdate = {
      updates: changedBody,
      removes: removes
    };

    this.service.updateService(dataUpdate, this.idService).subscribe({
      next: (response: any) => {
        if (response.statusCode !== 200) {
          this.mytoastr.showWarning(response.messages, '');
          return;
        }
        this.mytoastr.showSuccess('Servicio Actualizado correctamente', '');
        this.router.navigate(['/service']);
      },
      error: (error: any) => {
        console.error('ERROR: ', error);
      }
    });
  }

  private getCommissionRemoves(originalType: string, currentType: string): string {
    if (!originalType || originalType === currentType) return '';

    // Campos que usa cada tipo de comisión
    const typeFields: Record<string, string[]> = {
      'FIJO': ['comissionFixed'],
      'PORCENTUAL': ['comissionPCT'],
      'MULTIPLE': ['comissionFixed', 'comissionCriterion', 'comissionPCT'],
      'RANGO': ['comissionCriterion', 'comissionRange'],
    };

    const originalFields = typeFields[originalType] ?? [];
    const currentFields = typeFields[currentType] ?? [];

    // Solo se eliminan los campos que tenía el tipo anterior y el nuevo NO tiene
    return originalFields
      .filter(field => !currentFields.includes(field))
      .join(',');
  }

  private hasDiff(current: any, original: any): boolean {
    if (!original) return true;
    return JSON.stringify(current) !== JSON.stringify(original);
  }

  private getBodyDiff(current: any, original: any): any {
    if (!original) return current;
    const diff: any = {};

    for (const key of Object.keys(current)) {
      if (key === 'userRegistration') continue;

      const cur = current[key];
      const orig = original[key];

      const changed =
        Array.isArray(cur) || typeof cur === 'object'
          ? JSON.stringify(cur) !== JSON.stringify(orig)
          : cur !== orig;

      if (changed) diff[key] = cur;
    }

    return diff;
  }

  AddService(data: any) {
    this.service.registerService(data).subscribe({
      next: (response: any) => {
        if (response.statusCode !== 200) {
          this.mytoastr.showWarning(response.messages, '');
          return;
        }
        this.mytoastr.showSuccess('Guardado Correctamente', '');
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
    this.register = this.register.filter(item => item.id !== element.id);
    this.dataPayment = [...this.register];
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
    if (this.comissionForm.get('comission_range_lower')) {
      this.comissionForm.removeControl('comission_range_lower');
    }
    if (this.comissionForm.get('comission_range_upper')) {
      this.comissionForm.removeControl('comission_range_upper');
    }

    switch (event.value) {
      case 'FIJO':
        this.comissionForm.addControl('comission_fixed', this.fb.control('', Validators.required));
        this.comissionPercentage = false;
        this.comissionCriterio = false;
        this.comissionFixed = true;
        this.comissionRange = false;
        break
        ;
      case 'PORCENTUAL':
        this.comissionForm.addControl('comission_percentage', this.fb.control('', Validators.required));
        this.comissionFixed = false;
        this.comissionCriterio = false;
        this.comissionPercentage = true;
        this.comissionRange = false;

        break
        ;
      case 'MULTIPLE':
        this.comissionForm.addControl('comission_fixed', this.fb.control('', Validators.required));
        this.comissionForm.addControl('comission_criterion', this.fb.control('', Validators.required));
        this.comissionForm.addControl('comission_percentage', this.fb.control('', Validators.required));
        this.comissionCriterio = true;
        this.comissionFixed = true;
        this.comissionPercentage = true;
        this.comissionRange = false;
        break
        ;
      case 'RANGO':
        this.comissionForm.addControl('comission_criterion', this.fb.control('', Validators.required));
        this.comissionForm.addControl('comission_range_lower', this.fb.control('', Validators.required));
        this.comissionForm.addControl('comission_range_upper', this.fb.control('', Validators.required));
        this.comissionCriterio = true;
        this.comissionPercentage = false;
        this.comissionFixed = false;
        this.comissionRange = true;
        break;
    };

  }

  /**
   * A partir del fieldType.id que viene del backend, ubica la entrada
   * correspondiente en dataTypeCatalog para poder mostrar el label amigable
   * en la tabla al editar un servicio existente.
   */
  private mapExistingPaymentFields(fields: any[]): any[] {
    return (fields || []).map(f => {
      const match = this.dataTypeCatalog.find(t => t.fieldTypeId === f.fieldType?.id);
      return {
        ...f,
        dataTypeKey: match ? match.key : null,
        dataTypeLabel: match ? match.label : (f.fieldType?.name ?? f.fieldMask)
      };
    });
  }

  private async getIdService(idService: string): Promise<void> {
    this.loadingExistingService = true;
    try {
      const response: any = await firstValueFrom(this.service.getIdServices(idService));
      const data = response.data;

      this.service_name.setValue(data.name);
      this.service_name.disable();

      this.service_convenio.setValue(data.id_serviceProv);
      this.service_convenio.disable();
      this.originalIdServiceProv = data.id_serviceProv;

      this.service_prov.setValue(data.idProvider);
      this.service_prov.disable();

      this.service_zone.setValue(data.zone ?? null);

      this.service_state.setValue(data.status);
      const typeSrv = this.typeService.find((t: any) => t.master_name === data.serviceType.name);
      this.service_type.setValue(typeSrv);
      this.service_type.disable();

      this.service_type_business.setValue(data.business);
      this.service_type_business.disable();

      this.dataPayment = this.mapExistingPaymentFields(data['additional-payment-fields']);
      this.register = [...this.dataPayment];

      this.indicatrs = data.indicators;

      const baseDatos = data.indicators.some(
        i => i.id === 'PAY_BILL' && i.isActive
      );

      const interconectado = data.indicators.some(
        i => i.id === 'PAY_ONLINE' && i.isActive
      );

      let modalidad = '';

      if (baseDatos) {
        modalidad = 'PAY_BILL';
      } else if (interconectado) {
        modalidad += ', PAY_ONLINE';
      }

      this.service_collection_type?.setValue(modalidad);

      this.idProviderService = data.idProvider;
      this.fixcomisionService = data.fixedcomission;

      this.type_Comission.setValue(data.typeComission);
      this.selectionComissionProv({ value: data.typeComission });

      if (data.fixedcomission) this.comission_fixed.setValue(data.fixedcomission);
      if (data.pctcomission) this.pctcomission.setValue(data.pctcomission);
      if (data.comissioncriterion) this.comissioncriterion.setValue(data.comissioncriterion);
      if (data.rangecomission) {
        const { lower, upper } = JSON.parse(data.rangecomission)
        this.comission_range_lower.setValue(lower);
        this.comission_range_upper.setValue(upper);
      }


      this.service_indicators.setValue(this.indicatrs.filter(i => i.isActive).map(i => i.id));

      this.originalBodyBase = {
        idProvider: data.idProvider,
        idClient: '00000100',
        idServiceProv: data.id_serviceProv,
        serviceName: data.name,
        idTypeService: String(data.serviceType.id),
        typeService: data.serviceType.name,
        business: data.business,
        status: data.status,
        zone: data.zone ?? null,
        typeComission: data.typeComission,
        comissionFixed: data.fixedcomission,
        comissionCriterion: data.comissioncriterion,
        comissionRange: data.comissionrange,
        comissionPCT: data.pctcomission,
        indicators: JSON.parse(JSON.stringify(this.indicatrs)),
        additionalPaymentFields: JSON.parse(JSON.stringify(this.dataPayment))
      };
    } catch (err) {
      console.error('ERROR: ', err);
    } finally {
      this.loadingExistingService = false;
      this.spinner.spinnerOnOff();
    }
  }

  registerPayment() {
    if (!this.paymentFieldsForm.valid) {
      this.mytoastr.showWarning('Complete el formulario', '');
      return;
    }

    const selectedType = this.dataTypeCatalog.find(
      t => t.key === this.paymentFieldsForm.value.paymentFields_dataType
    );

    if (!selectedType) {
      this.mytoastr.showWarning('Seleccione un tipo de dato válido', '');
      return;
    }

    const data = {
      id: this.paymentFieldsForm.value.paymentFields_id,
      name: this.paymentFieldsForm.value.paymentFields_name,
      fieldType: {
        id: selectedType.fieldTypeId,
        name: selectedType.fieldTypeName
      },
      fieldMask: selectedType.fieldMask,
      maximumLength: this.paymentFieldsForm.value.paymentFields_max,
      isMandatory: this.paymentFieldsForm.value.paymentFields_mandatory || this.isMandatory,
      isEditable: this.paymentFieldsForm.value.paymentFields_edit || this.isEdit,
      // Solo para uso interno del frontend (mostrar el tipo amigable en la
      // tabla). Se excluyen del payload antes de enviarlo al backend, ver
      // buildAdditionalPaymentFieldsPayload().
      dataTypeKey: selectedType.key,
      dataTypeLabel: selectedType.label
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

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }

    if (this.currentStep === 1) this.tab2 = false;
    if (this.currentStep === 2) this.tab3 = false;
  }

  onTabChange(index: number) {
    this.currentStep = index;
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
  get service_indicators() { return this.serviceForm.get('service_indicators'); }
  get service_collection_type() { return this.serviceForm.get('service_collection_type'); }
  get paymentFields_dataType() { return this.paymentFieldsForm.get('paymentFields_dataType'); }

  get type_Comission() { return this.comissionForm.get('comission_type'); }

  get comission_fixed() { return this.comissionForm.get('comission_fixed'); }
  get pctcomission() { return this.comissionForm.get('comission_percentage'); }
  get comissioncriterion() { return this.comissionForm.get('comission_criterion'); }
  get comission_range_lower() { return this.comissionForm.get('comission_range_lower'); }
  get comission_range_upper() { return this.comissionForm.get('comission_range_upper'); }
}