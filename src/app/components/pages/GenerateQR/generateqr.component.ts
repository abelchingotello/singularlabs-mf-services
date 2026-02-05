import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PageEvent } from '@angular/material/paginator';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';
import { expand, filter, forkJoin, EMPTY, scan, startWith, lastValueFrom, finalize, map } from 'rxjs';
import { DialogServiceConfigComponent } from 'src/app/dialogs/dialog-service-config/dialog-service-config.component';
import { GenerateQrService } from 'src/app/services/generateqr.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import * as QRCode from 'qrcode';
import jwtDecode from 'jwt-decode';

@Component({
  selector: 'uni-services',
  templateUrl: './generateqr.component.html',
  styleUrls: ['./generateqr.component.scss']
})
export class GenerateQR implements OnInit {

  public columns: any[] = [
    { name: 'ID QR', attribute: 'id_qr' },
    { name: 'Suministro', attribute: 'suministro' },
    { name: 'Servicio', attribute: 'empresa' },
    {
      name: 'Fecha creacion',
      attribute: 'qr_created_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    {
      name: 'Fecha vencimiento',
      attribute: 'expired_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    { name: 'Monto', attribute: 'amount' },
    {
      name: 'Estado pago',
      attribute: 'estado_pago_label',
      config: {
        styleClass: true
      }
    },
    {
      name: 'Estado anulado',
      attribute: 'estado_anulado_label',
      config: {
        styleClass: true
      }
    },
    { name: 'Job ID', attribute: 'job_id' },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          {
            hide: false,
            bgClass: 'gray',
            toolTip: 'Ver QR',
            icon: 'visibility',
            value: 'view_qr'
          },
          {
            hide: false,
            bgClass: 'red',
            toolTip: 'Anular QR',
            icon: 'cancel',
            value: 'cancel_qr'
          },
          {
            hide: false,
            bgClass: 'yellow',
            toolTip: 'Marcar devuelto',
            icon: 'undo',
            value: 'mark_returned'
          }
        ]
      }
    },
  ];
  public options: any[] = [
    { value: 'Servicio', id: '1' },
    { value: 'Entidad-Servicio', id: '2' },
    { value: 'Client-Servicio', id: '3' },
  ]

  public pageSize: any = 5;
  public pageKey: any[];
  public close: boolean = false;
  public serviceForm!: FormGroup;
  public qrForm!: FormGroup;
  public massiveForm!: FormGroup;
  public dataFilter: any = [];
  public dataService: any[];
  public listFilters: any = {};
  public functionDataCurrent: (pageSize: any) => any;
  public disabledEditOption: any
  public editOption: any;
  public selectedIds: any;
  public stateMaster: any;
  public dataIdService: any;
  public optionId: any
  public categoriesService: any[] = [];
  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];
  public allItems1: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';
  public filterServiceSelected: ServiceItem | null = null;

  public estadoPagoOptions = [
    { value: '0', label: 'pendiente' },
    { value: '1', label: 'pagado' },
    { value: '2', label: 'notificado no pagado' },
    { value: '3', label: 'fallido' }
  ];
  public estadoAnuladoOptions = [
    { value: '0', label: 'vigente' },
    { value: '1', label: 'anulado' }
  ];
  public qrFilteredServices: ServiceItem[] = [];
  public qrAllItems: ServiceItem[] = [];
  public qrServiceFilter: string = '';
  public qrSelectedCategory: boolean = false;
  public qrSelectedService: ServiceItem | null = null;
  public minDate: Date = new Date();
  public qrResult: any = null;
  public qrImageSrc: string = '';
  public pendingCancelId: string | null = null;
  public massiveResult: any = null;
  public sftpItems: string[] = [];
  public massiveServiceFilter: string = '';
  public massiveFilteredServices: ServiceItem[] = [];
  public massiveSelectedServiceName: string = '';
  private qrDialogRef?: MatDialogRef<any>;
  private qrResultDialogRef?: MatDialogRef<any>;
  private cancelDialogRef?: MatDialogRef<any>;
  private cancelBlockedDialogRef?: MatDialogRef<any>;
  private markReturnedDialogRef?: MatDialogRef<any>;
  private qrMassiveDialogRef?: MatDialogRef<any>;
  public qrDialogMode: 'create' | 'view' = 'create';
  public isGeneratingQr: boolean = false;
  public isGeneratingMassive: boolean = false;
  public isCancellingQr: boolean = false;
  public isMarkingReturned: boolean = false;

  private pagUtils: PaginationUtils | undefined;
  public page: number = 1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos
  public listProviders: any;
  public selectedCategory: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  @ViewChild('generateQrDialog') generateQrDialog!: TemplateRef<any>;
  @ViewChild('generateQrResultDialog') generateQrResultDialog!: TemplateRef<any>;
  @ViewChild('cancelQrDialog') cancelQrDialog!: TemplateRef<any>;
  @ViewChild('cancelBlockedDialog') cancelBlockedDialog!: TemplateRef<any>;
  @ViewChild('markReturnedDialog') markReturnedDialog!: TemplateRef<any>;
  @ViewChild('generateQrMassiveDialog') generateQrMassiveDialog!: TemplateRef<any>;


  constructor(
    private router: Router,
    private services: ServicesService,
    private fb: FormBuilder,
    private master: MasterService,
    private person: PersonService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private personService: PersonService,
    private generateQrService: GenerateQrService,
    private authService: AuthService,
    public dialog: MatDialog,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.minDate.setHours(0, 0, 0, 0);
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.formService();//inicializa los inputs como vacios
    this.formQr();
    this.formMassive();
    this.dataMaster();//carga lista de estados
    this.listData();//carga lista de tipos de servicios
    this.serviceForm.get('service_type')?.setValue('LUZ');
    this.cargarServicios();
    // Suscribirse a cambios y convertir a mayusculas
    this.service_name?.valueChanges.subscribe(value => {
      if (value) {
        this.service_name?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });
    this.functionDataCurrent = this.dataInitial.bind(this); //replica la funcion
    this.functionDataCurrent(this.pageSize);
  }

  async selectCategory() {
    if (!this.service_type.value) {
      this.selectedCategory = false;
      this.filteredServices = [];
      this.listServicesSelected = [];
      this.serviceForm.get('idService')?.setValue('')
      this.serviceForm.get('service_name')?.setValue('')
      return;
    }
    this.serviceForm.get('service_name')?.setValue('')
    this.selectedCategory = true;
    await this.cargarServicios();
  }

  onServicesChange(event: any) {
    const selectedId = Array.isArray(event.value)
      ? event.value[event.value.length - 1]
      : event.value;
    const selectedObject = this.allItems1.find(s => s.id === selectedId);
    this.listServicesSelected = selectedObject ? [selectedObject] : [];
    this.serviceForm.get('idService')?.setValue(selectedId || '');
  }


  


  openGenerateQrDialog() {
    this.qrResult = null;
    this.qrImageSrc = '';
    this.qrDialogMode = 'create';
    this.isGeneratingQr = false;
    this.qrForm.reset();
    this.qrSelectedCategory = false;
    this.qrServiceFilter = '';
    this.qrFilteredServices = [];
    this.qrAllItems = [];
    this.qrSelectedService = null;
    const defaultType = 'LUZ';
    this.qrForm.get('service_type')?.setValue(defaultType);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.qrForm.get('due_date_date')?.setValue(tomorrow);
    this.qrForm.get('due_date_time')?.setValue('23:59');
    if (defaultType) {
      this.qrSelectedCategory = true;
      this.cargarServiciosQr();
    }
    this.qrDialogRef = this.dialog.open(this.generateQrDialog, {
      width: '640px',
      maxWidth: '92vw',
      panelClass: 'qr-dialog'
    });
  }
  onFilterServiceChange(event: any) {
    const selectedId = event.value;
    const selectedObject = this.filteredServices.find(s => s.name === selectedId);
    this.filterServiceSelected = selectedObject ?? null;
    this.serviceForm.get('empresa')?.setValue(selectedId || '');
  }

  get filterServiceName(): string {
    return this.filterServiceSelected?.name || '';
  }




  openCancelQrDialog(element: any) {
    this.pendingCancelId = String(element?.id_qr || element?.id || '');
    if (!this.pendingCancelId) {
      this.mytoastr.showWarning('ID QR no disponible', '');
      return;
    }
    const estadoPago = String(element?.estado_pago_label || '').toLowerCase();
    const estadoPagoRaw = element?.estado_pago;
    if (estadoPago === 'pagado' || estadoPagoRaw === 1 || estadoPagoRaw === '1') {
      this.cancelBlockedDialogRef = this.dialog.open(this.cancelBlockedDialog, {
        width: '420px',
        maxWidth: '92vw',
        panelClass: 'qr-dialog'
      });
      return;
    }
    this.cancelDialogRef = this.dialog.open(this.cancelQrDialog, {
      width: '420px',
      maxWidth: '92vw',
      panelClass: 'qr-dialog'
    });
  }

  confirmCancelQr() {
    if (!this.pendingCancelId || this.isCancellingQr) {
      return;
    }
    this.isCancellingQr = true;
    this.spinner.spinnerOnOff();
    const responsable = this.getResponsable();
    this.generateQrService.cancelQr([this.pendingCancelId], responsable).pipe(
      finalize(() => {
        this.isCancellingQr = false;
      })
    ).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        this.mytoastr.showWarning('QR anulado', '');
        if (this.cancelDialogRef) {
          this.cancelDialogRef.close();
        }
        this.reload();
      },
      error: (err) => {
        console.error(err);
        this.spinner.spinnerOnOff();
        this.mytoastr.showError('Error al anular QR', '');
      }
    });
  }

  openMarkReturnedDialog(element: any) {
    this.pendingCancelId = String(element?.id_qr || element?.id || '');
    if (!this.pendingCancelId) {
      this.mytoastr.showWarning('ID QR no disponible', '');
      return;
    }
    this.markReturnedDialogRef = this.dialog.open(this.markReturnedDialog, {
      width: '460px',
      maxWidth: '92vw',
      panelClass: 'qr-dialog'
    });
  }

  confirmMarkReturned() {
    if (!this.pendingCancelId || this.isMarkingReturned) {
      return;
    }
    this.isMarkingReturned = true;
    this.spinner.spinnerOnOff();
    const responsable = this.getResponsable();
    this.generateQrService.markReturned([this.pendingCancelId], responsable).pipe(
      finalize(() => {
        this.isMarkingReturned = false;
      })
    ).subscribe({
      next: () => {
        this.spinner.spinnerOnOff();
        this.mytoastr.showWarning('Estado actualizado', '');
        if (this.markReturnedDialogRef) {
          this.markReturnedDialogRef.close();
        }
        this.reload();
      },
      error: (err) => {
        console.error(err);
        this.spinner.spinnerOnOff();
        this.mytoastr.showError('Error al actualizar estado', '');
      }
    });
  }

  private getResponsable(): string {
    const user = this.authService.getUser?.();
    const candidate = user?.username || user?.user_name || user?.name || user?.full_name || user?.email || user?.user || user?.nombre;
    if (candidate) {
      return String(candidate);
    }
    try {
      const token = this.authService.getToken?.();
      if (token) {
        const decoded: any = jwtDecode(token);
        return String(decoded?.username || decoded?.email || decoded?.['cognito:username'] || decoded?.sub || '');
      }
    } catch {
      return '';
    }
    return '';
  }

  openGenerateQrMassiveDialog() {
    this.massiveResult = null;
    this.sftpItems = [];
    this.massiveServiceFilter = '';
    this.massiveSelectedServiceName = '';
    this.massiveFilteredServices = [...this.allItems1];
    if (!this.massiveFilteredServices.length) {
      this.cargarServicios();
    }
    this.isGeneratingMassive = false;
    this.massiveForm.reset();
    this.massiveForm.get('workers')?.setValue(1);
    this.qrMassiveDialogRef = this.dialog.open(this.generateQrMassiveDialog, {
      width: '640px',
      maxWidth: '92vw',
      panelClass: 'qr-dialog'
    });
  }

  onMassiveServiceChange(event: any) {
    const serviceName = event?.value || '';
    this.massiveSelectedServiceName = serviceName;
    this.massiveForm.get('fileName')?.setValue('');
    this.sftpItems = [];
    if (serviceName) {
      this.loadSftpItems(serviceName);
    }
  }

  filterMassiveServices() {
    const value = this.massiveServiceFilter?.toLowerCase() || '';
    this.massiveFilteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  private loadSftpItems(serviceName: string) {
    this.spinner.spinnerOnOff();
    this.generateQrService.listSftp('in', serviceName).subscribe({
      next: (response) => {
        const items = response?.items ?? response?.data?.items ?? [];
        this.sftpItems = Array.isArray(items) ? items : [];
      },
      error: (err) => {
        console.error(err);
        this.mytoastr.showError('Error al cargar archivos SFTP', '');
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    });
  }

  generateQr() {
    if (this.qrForm.invalid) {
      this.qrForm.markAllAsTouched();
      this.mytoastr.showWarning('Complete los campos obligatorios', '');
      return;
    }
    if (this.isGeneratingQr) {
      return;
    }
    const payload = {
      suministro: this.qrForm.get('suministro')?.value,
      empresa: this.qrSelectedService?.name || '',
      cliente: this.qrForm.get('titular')?.value,
      amount: this.qr_amount_cents,
      description: this.qrForm.get('receipt_number')?.value || '',
      expiredAt: this.qrForm.get('due_date')?.value,
      cellphone: '',
      email: ''
    };
    console.log('GenerateQR payload:', payload);
    this.isGeneratingQr = true;
    this.spinner.spinnerOnOff();
    this.generateQrService.generateIndividual(payload).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        this.isGeneratingQr = false;
        if (response?.logError || response?.excelError) {
          const msg = response?.logError || response?.excelError || 'Error al generar QR';
          this.mytoastr.showError(msg, '');
          return;
        }
        this.qrResult = response;
        this.qrImageSrc = response?.imageBase64
          ? `data:image/png;base64,${response.imageBase64}`
          : '';
        if (this.qrDialogRef) {
          this.qrDialogRef.close();
        }
        this.openQrResultDialog('create');
      },
      error: (err) => {
        console.error(err);
        this.spinner.spinnerOnOff();
        this.isGeneratingQr = false;
        this.mytoastr.showError('Error al generar QR', '');
      }
    });
  }

  generateQrMassive() {
    if (this.massiveForm.invalid) {
      this.massiveForm.markAllAsTouched();
      this.mytoastr.showWarning('Complete los campos obligatorios', '');
      return;
    }
    if (this.isGeneratingMassive) {
      return;
    }
    const fileName = this.massiveForm.get('fileName')?.value;
    const workersRaw = this.massiveForm.get('workers')?.value;
    const payload = {
      sftpPath: `in/${fileName}`,
      outputDir: 'out',
      workers: Number(workersRaw),
      serviceName: this.massiveForm.get('serviceName')?.value
    };
    this.isGeneratingMassive = true;
    this.spinner.spinnerOnOff();
    this.generateQrService.generateMassive(payload).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        this.isGeneratingMassive = false;
        this.massiveResult = response;
      },
      error: (err) => {
        console.error(err);
        this.spinner.spinnerOnOff();
        this.isGeneratingMassive = false;
        this.mytoastr.showError('Error al generar QR masivo', '');
      }
    });
  }

  backToForm() {
    if (this.qrDialogMode === 'view') {
      return;
    }
    this.openGenerateQrDialog();
  }

  downloadQrImage() {
    if (!this.qrImageSrc) {
      return;
    }
    const fileBase = this.buildQrFileName();
    const link = document.createElement('a');
    link.href = this.qrImageSrc;
    link.download = `${fileBase}.png`;
    link.click();
  }

  async selectCategoryQr() {
    if (!this.qr_service_type?.value) {
      this.qrSelectedCategory = false;
      this.qrFilteredServices = [];
      this.qrAllItems = [];
      this.qrSelectedService = null;
      this.qrForm.get('idService')?.setValue('');
      return;
    }
    this.qrSelectedCategory = true;
    await this.cargarServiciosQr();
  }

  onQrServiceChange(event: any) {
    const selectedId = Array.isArray(event.value)
      ? event.value[event.value.length - 1]
      : event.value;
    const selectedObject = this.qrAllItems.find(s => s.id === selectedId);
    this.qrSelectedService = selectedObject ?? null;
    this.qrForm.get('idService')?.setValue(selectedId || '');
  }

  filterQrServices() {
    const value = this.qrServiceFilter?.toLowerCase() || '';
    this.qrFilteredServices = this.qrAllItems.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  async cargarServiciosQr(): Promise<void> {
    try {
      this.spinner.spinnerOnOff();
      const type = this.qr_service_type?.value;
      const allItems = await lastValueFrom(
        this.loadAllServicesByType(type).pipe(
          filter((items: any) => items.length > 0),
          finalize(() => this.spinner.spinnerOnOff())
        )
      );
      this.qrFilteredServices = allItems;
      this.qrAllItems = allItems;
      this.qrServiceFilter = '';
      this.filterQrServices();
    } catch (error) {
      console.error('Error al cargar servicios QR:', error);
      this.qrFilteredServices = [];
      this.mytoastr.showError('', 'No tiene Servicios')
    }
  }


  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
    this.spinner.spinnerOnOff
  }

  async cargarServicios(): Promise<void> {
    try {
      this.spinner.spinnerOnOff();
      const allItems = await lastValueFrom(
        this.loadAllServices().pipe(
          filter((items: any) => items.length > 0),
          finalize(() => this.spinner.spinnerOnOff())
        )
      );
      this.filteredServices = allItems;
      this.allItems1 = allItems;
      this.serviceFilter = '';
      this.filterServices();
    } catch (error) {
      console.error("❌ Error al cargar servicios:", error);
      this.filteredServices = [];
      this.mytoastr.showError('', 'No tiene Servicios')
    }
  }

  loadAllServices() {
    return this.loadAllServicesByType(this.service_type.value);
  }

  loadAllServicesByType(serviceType: string) {
    return this.services.getServicesFromCategory(serviceType).pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.services.getServicesFromCategory(serviceType, response.data.nextPageKey)
          : EMPTY // Termina el flujo cuando no hay mas paginas
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc, items) => acc.concat(items), []),
      startWith([])
    );
  }

  dataInitial(pageSize: any) {
    this.spinner.spinnerOnOff();
    const page = this.page && this.page > 0 ? this.page : 1;
    const requiredLength = page * pageSize;
    if (this.dataFilter?.length >= requiredLength) {
      this.dataService = [...this.dataFilter];
      this.spinner.spinnerOnOff();
      this.close = true;
      return;
    }
    this.generateQrService.listIndividuals(page, pageSize, this.listFilters).subscribe({
      next: (data) => {
        if (data?.statusCode && data.statusCode !== 200) {
          this.mytoastr.showWarning(data?.messages || 'No se pudo cargar el listado', '')
          return
        }
        const items = Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data?.Items)
              ? data.data.Items
              : Array.isArray(data?.Items)
                ? data.Items
                : Array.isArray(data?.data)
                  ? data.data
                  : Array.isArray(data)
                    ? data
                    : [];
        if (page === 1) {
          this.dataFilter = [];
        }
        const normalizedItems = items.map((item: any) => ({
          ...item,
          amount: this.normalizeAmount(item?.amount),
          estado_pago_label: this.formatEstadoPago(item?.estado_pago),
          estado_anulado_label: this.formatEstadoAnulado(item?.estado_anulado)
        }));
        this.dataFilter = [...this.dataFilter, ...normalizedItems];
        this.dataService = [...this.dataFilter];
        this.count =
          data?.data?.total ??
          data?.total ??
          data?.data?.Count ??
          data?.Count ??
          data?.count ??
          this.dataService.length;
      },
      error: (err) => {
        console.log(err);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
        this.close = true
      }
    })
  }

  formService() {
    this.serviceForm = this.fb.group({
      start_date: [''],
      end_date: [''],
      estado_pago: [''],
      estado_anulado: [''],
      suministro: [''],
      empresa: [''],
      jobId: [''],
      service_name: [''],
      idService: [''],
      service_type: [''],
      service_id: [''],
      provider: [''],
      status: ['']
    }, { validators: this.dateRangeValidator('start_date', 'end_date') })
  }

  formQr() {
    this.qrForm = this.fb.group({
      service_type: [''],
      idService: ['', [Validators.required]],
      suministro: ['', [Validators.required, Validators.pattern(/^\d{1,10}$/)]],
      titular: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{2})$/), this.maxAmountValidator(500)]],
      receipt_number: ['', [Validators.pattern(/^\d+$/)]],
      due_date: ['', [Validators.required, this.futureDateValidator()]],
      due_date_date: ['', [Validators.required]],
      due_date_time: ['23:59', [Validators.required]]
    })

    this.qrForm.get('due_date_date')?.valueChanges.subscribe(() => this.syncDueDate());
    this.qrForm.get('due_date_time')?.valueChanges.subscribe(() => this.syncDueDate());
  }

  formMassive() {
    this.massiveForm = this.fb.group({
      serviceName: ['', [Validators.required]],
      fileName: ['', [Validators.required]],
      workers: [1, [Validators.required, Validators.min(1)]]
    })
  }

  private syncDueDate() {
    const dateValue = this.qrForm.get('due_date_date')?.value;
    const timeValue = this.qrForm.get('due_date_time')?.value;
    if (!dateValue || !timeValue) {
      this.qrForm.get('due_date')?.setValue('', { emitEvent: false });
      this.qrForm.get('due_date')?.updateValueAndValidity({ emitEvent: false });
      return;
    }
    const date = new Date(dateValue);
    const [hh, mm] = String(timeValue).split(':');
    const hour = Number(hh);
    const minute = Number(mm);
    if (Number.isNaN(date.getTime()) || Number.isNaN(hour) || Number.isNaN(minute)) {
      this.qrForm.get('due_date')?.setValue('', { emitEvent: false });
      this.qrForm.get('due_date')?.updateValueAndValidity({ emitEvent: false });
      return;
    }
    date.setHours(hour, minute, 59, 0);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mmStr = String(date.getMinutes()).padStart(2, '0');
    const formatted = `${yyyy}-${MM}-${dd} ${HH}:${mmStr}:59`;
    this.qrForm.get('due_date')?.setValue(formatted, { emitEvent: false });
    this.qrForm.get('due_date')?.updateValueAndValidity({ emitEvent: false });
  }

  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) {
        return null;
      }
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
      if (!match) {
        return { invalidFormat: true };
      }
      const [_, y, m, d, hh, mm, ss] = match;
      const year = Number(y);
      const month = Number(m);
      const day = Number(d);
      const hour = Number(hh);
      const min = Number(mm);
      const sec = Number(ss);
      const date = new Date(year, month - 1, day, hour, min, sec);
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== min ||
        date.getSeconds() !== sec
      ) {
        return { invalidDate: true };
      }
      if (date.getTime() <= Date.now()) {
        return { notFuture: true };
      }
      return null;
    };
  }

  onNumericInput(event: Event, maxLength: number) {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, maxLength);
    input.value = digits;
    return digits;
  }

  onAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '');
    if (digits.length > 5) {
      digits = digits.slice(0, 5);
    }
    if (!digits) {
      input.value = '';
      this.qrForm.get('amount')?.setValue('', { emitEvent: false });
      return;
    }
    let intPart = digits.length > 2 ? digits.slice(0, -2) : '0';
    const decPart = digits.length > 1 ? digits.slice(-2) : `0${digits}`;
    intPart = intPart.replace(/^0+(?=\d)/, '');
    if (intPart === '') {
      intPart = '0';
    }
    const value = `${intPart}.${decPart}`;
    input.value = value;
    this.qrForm.get('amount')?.setValue(value, { emitEvent: false });
  }

  onAmountBlur() {
    const value = this.qrForm.get('amount')?.value;
    if (value === null || value === undefined || value === '') {
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      this.qrForm.get('amount')?.setValue(num.toFixed(2), { emitEvent: false });
    }
  }

  private maxAmountValidator(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const num = Number(value);
      if (Number.isNaN(num)) {
        return { invalidAmount: true };
      }
      return num > max ? { maxAmount: { max, actual: num } } : null;
    };
  }

  addService() {
    this.router.navigate(['service/add'])
  }

  updateService() {
    this.router.navigate(['service/import', 'update']);
  }

  createService() {
    this.router.navigate(['service/import', 'create']);
  }

  searchData() {
    this.listFilters = this.buildListFilters();
    this.clearData();
    this.dataInitial(this.pageSize);
  }

  cleanSearch() {
    this.service_name.setValue('')
    this.close = false;
    this.serviceFilter = '';
    this.filteredServices = [];
    this.listServicesSelected = [];
    this.allItems = [];
    this.listServicesSelected = [];
    this.listFilters = {};
    this.clearData();
  }

  clickButton(event) {
    console.log("event", event)
    const { value, element } = event
    if (value == "view_qr") {
      this.openQrPreview(element)
    } else if (value == "cancel_qr") {
      this.openCancelQrDialog(element)
    } else if (value == "mark_returned") {
      this.openMarkReturnedDialog(element)
    }
  }

  openDialogConfigService(element) {

    const dialogRef = this.dialog.open(DialogServiceConfigComponent, {

      width: '600px',
      data: {
        serviceName: element.name,
        serviceId: element.id,
        serviceAmountTransactionRestriccion: element.amountTransactionRestriccion,
        serviceAmountDailyRestriccion: element.amountDailyRestriccion,
      }
    });

    dialogRef.afterClosed().subscribe(
      response => {
        if (response) {
          console.log('result en afterClosed of openDialogMinBalance', response)
          this.reload();
        }
      });



  }

  editElement(id: any) {
    this.router.navigate([`/service/edit/${id}`]);
  }

  dataMaster() {
    this.master.getItemsMasterTable('1').subscribe({
      next: (data) => {
        this.stateMaster = data;
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.master.getItemsMasterTable('14'), // CategoriaService
      this.personService.getPerson('PROVEEDOR'),
    ]).subscribe({
      next: (response) => {
        const [categoryService, providers] = response;
        this.categoriesService = categoryService;
        this.listProviders = providers.data;
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error("Error loading master table data:", error);
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      },
    });
  }

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataService = [];
    this.dataFilter = [];
    this.allItems = [];
    this.page = 1;
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.dataInitial(this.pageSize);
    // this.functionDataCurrent(this.pageSize);
  }

  /************************************* METODOS DE BOTONES ***********************************/
  clearFormAndData() {
    this.clearData();
    this.cleanSearch();
    this.serviceForm.reset();
    this.listFilters = {};
    this.selectedCategory = false;
    this.listServicesSelected = [];
    this.dataInitial(this.pageSize);
  }


  /******************************** METODOS DE PAGINADO *************************************/
  onPageChange(event: PageEvent) {
    console.log('onPageChange', event);
    console.log('pageSize', this.pageSize);
    const sizeChanged = event.pageSize !== this.pageSize;
    this.pageSize = event.pageSize;
    this.page = event.pageIndex + 1;
    if (sizeChanged) {
      this.dataFilter = [];
      this.dataService = [];
    }
    this.dataInitial(this.pageSize);
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = Object.keys(this.listFilters || {}).length
      ? { ...this.listFilters }
      : this.buildListFilters();

    // alias keys for backend compatibility
    if (exportFilters['estado'] && !exportFilters['estadoPago']) {
      exportFilters['estadoPago'] = exportFilters['estado'];
    }
    if (exportFilters['estadoAnulado'] && !exportFilters['estado_anulado']) {
      exportFilters['estado_anulado'] = exportFilters['estadoAnulado'];
    }
    if (exportFilters['empresa'] && !exportFilters['servicio']) {
      exportFilters['servicio'] = exportFilters['empresa'];
    }

    const inbx = 'generate_qr';
    const token = localStorage.getItem('fcmToken');
    this.generateQrService.exportServices(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarning('', 'Procesando Archivo...')
        } else {
          this.mytoastr.showError('', 'Error al enviar la solicitud')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error durante la exportaci?n:', error);
        this.mytoastr.showError('Error durante la exportaci?n', '');
      }
    });
  }

  
/******************************************** METODOS GET ****************************************/

  get service_name() {
    return this.serviceForm.get('service_name')
  }

  get service_type() {
    return this.serviceForm?.get('service_type')
  }

  get status() {
    return this.serviceForm.get('status')
  }

  get service_id() {
    return this.serviceForm.get('service_id')
  }

  get provider() {
    return this.serviceForm.get('provider')
  }

  get qr_service_type() {
    return this.qrForm?.get('service_type')
  }

  get qr_idService() {
    return this.qrForm?.get('idService')
  }

  get qr_amount_cents(): number {
    const value = this.qrForm?.get('amount')?.value;
    const num = Number(value);
    if (Number.isNaN(num)) {
      return 0;
    }
    return Math.round(num * 100);
  }

  get qrServiceName(): string {
    return this.qrSelectedService?.name || '';
  }

  get qrDisplayName(): string {
    if (!this.qrResult) {
      return '-';
    }
    return (
      this.qrResult.business_name ||
      this.qrResult.name ||
      this.qrResult.empresa ||
      '-'
    );
  }

  get qrDisplayAmount(): string {
    const formAmount = this.qrForm?.get('amount')?.value;
    if (this.qrDialogMode === 'create' && formAmount) {
      return this.normalizeAmount(formAmount);
    }
    return this.normalizeAmount(this.qrResult?.amount);
  }

  get qrDetailTitle(): string {
    const fromResult = this.buildQrTitle(
      this.qrResult?.suministro,
      this.qrResult?.empresa,
      this.qrResult?.cliente
    );
    if (fromResult !== '-') {
      return fromResult;
    }
    const fromForm = this.buildQrTitle(
      this.qrForm?.get('suministro')?.value,
      this.qrSelectedService?.name || this.qrResult?.empresa,
      this.qrForm?.get('titular')?.value
    );
    return fromForm;
  }

  private buildQrTitle(suministro: any, empresa: any, cliente: any): string {
    const parts = [suministro, empresa, cliente]
      .filter((value: any) => value !== null && value !== undefined && String(value).trim() !== '')
      .map((value: any) => String(value).trim());
    return parts.length ? parts.join(' ') : '-';
  }

  get qrEstadoPagoLabel(): string {
    return this.formatEstadoPago(this.qrResult?.estado_pago);
  }

  get qrExpiredAtDisplay(): string {
    const formValue = this.qrForm?.get('due_date')?.value;
    const value = this.qrDialogMode === 'create'
      ? (formValue || this.qrResult?.expired_at || this.qrResult?.expiredAt)
      : (this.qrResult?.expired_at || this.qrResult?.expiredAt);
    return this.formatDateTimeDisplay(value);
  }

  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
  }

  get servicesId(): string {
    return this.listServicesSelected.map(s => s.id).join(', ');
  }

  private openQrResultDialog(mode: 'create' | 'view') {
    this.qrDialogMode = mode;
    this.qrResultDialogRef = this.dialog.open(this.generateQrResultDialog, {
      width: '640px',
      maxWidth: '92vw',
      panelClass: 'qr-dialog'
    });
  }

  private resolveQrImageSrc(row: any): string {
    if (!row) {
      return '';
    }
    const base64 = row?.imageBase64 || row?.qr_image_base64 || row?.qrImageBase64;
    if (base64) {
      return `data:image/png;base64,${base64}`;
    }
    const path = row?.qr_image_path;
    if (!path) {
      return '';
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const base = (environment.URL_API_GENERATE_QR || '').replace(/\/$/, '');
    return `${base}/${String(path).replace(/^\/+/, '')}`;
  }


  private buildListFilters(): Record<string, any> {
    const start = this.formatDateParam(this.serviceForm?.get('start_date')?.value);
    const end = this.formatDateParam(this.serviceForm?.get('end_date')?.value);
    const estadoPago = String(this.serviceForm?.get('estado_pago')?.value || '').trim();
    const estadoAnulado = String(this.serviceForm?.get('estado_anulado')?.value || '').trim();
    const suministro = String(this.serviceForm?.get('suministro')?.value || '').trim();
    const empresa = String(this.serviceForm?.get('empresa')?.value || '').trim();
    const jobId = String(this.serviceForm?.get('jobId')?.value || '').trim();
    const filters: Record<string, any> = {};
    if (start) {
      filters['start'] = start;
    }
    if (end) {
      filters['end'] = end;
    }
    if (estadoPago) {
      filters['estado'] = estadoPago;
    }
    if (estadoAnulado) {
      filters['estadoAnulado'] = estadoAnulado;
    }
    if (suministro) {
      filters['suministro'] = suministro;
    }
    if (empresa) {
      filters['empresa'] = empresa;
    }
    if (jobId) {
      filters['jobId'] = jobId;
    }
    return filters;
  }

  private formatDateTimeDisplay(value: any): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} hora : ${HH}:${mm}`;
  }

  private dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startValue = group.get(startKey)?.value;
      const endValue = group.get(endKey)?.value;
      if (!startValue || !endValue) {
        return null;
      }
      const start = new Date(startValue);
      const end = new Date(endValue);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      return start.getTime() <= end.getTime() ? null : { invalidDateRange: true };
    };
  }

  private formatDateParam(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}`;
  }


  private formatEstadoAnulado(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      return String(value);
    }
    switch (num) {
      case 0:
        return 'vigente';
      case 1:
        return 'anulado';
      default:
        return String(value);
    }
  }

  private formatEstadoPago(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      return String(value);
    }
    switch (num) {
      case 0:
        return 'pendiente';
      case 1:
        return 'pagado';
      case 2:
        return 'notificado_no_pagado';
      case 3:
        return 'fallido';
      default:
        return String(value);
    }
  }

  private normalizeAmount(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const raw = String(value).trim();
    if (/pen/i.test(raw)) {
      return raw;
    }
    const match = raw.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) {
      return raw;
    }
    const intPart = match[1];
    const decPart = match[2] ?? '';
    let num = Number(raw);
    if (decPart === '00' && intPart.length >= 3) {
      num = Number(intPart) / 100;
    }
    if (Number.isNaN(num)) {
      return raw;
    }
    return `${num.toFixed(2)} PEN`;
  }

  private buildQrFileName(): string {
    const base = this.qrDetailTitle && this.qrDetailTitle !== '-' ? this.qrDetailTitle : 'qr';
    const cleaned = base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    return cleaned || 'qr';
  }

  copyText(value: string | null | undefined) {
    if (!value) {
      return;
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(value));
    }
  }

  private async openQrPreview(row: any) {
    this.qrResult = row;
    this.qrImageSrc = '';
    this.openQrResultDialog('view');
    const hash = row?.hash_qr;
    if (hash) {
      try {
        this.qrImageSrc = await this.buildQrImageFromHash(hash);
        return;
      } catch (error) {
        console.error('Error generando QR desde hash:', error);
      }
    }
    this.qrImageSrc = this.resolveQrImageSrc(row);
  }

  private buildQrImageFromHash(hash: string): Promise<string> {
    return QRCode.toDataURL(hash, {
      width: 220,
      margin: 1
    });
  }

}

interface ServiceItem {
  id: string;
  name: string;
}
