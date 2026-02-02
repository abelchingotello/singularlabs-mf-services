import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { GenerateQrService } from 'src/app/services/generateqr.service';
import { AuthService } from 'src/app/services/auth.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ServicesService } from 'src/app/services/services.service';
import * as QRCode from 'qrcode';
import jwtDecode from 'jwt-decode';

interface ServiceItem {
  id: string;
  name: string;
}

@Component({
  selector: 'uni-generateqr-reports',
  templateUrl: './generateqr-reports.component.html',
  styleUrls: ['./generateqr-reports.component.scss']
})
export class GenerateQrReportsComponent implements OnInit {
  public columns: any[] = [
    { name: 'ID QR', attribute: 'qr_id' },
    {
      name: 'Fecha generacion',
      attribute: 'qr_created_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    {
      name: 'Fecha vencimiento',
      attribute: 'qr_expired_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    { name: 'Servicio', attribute: 'servicio' },
    { name: 'Suministro', attribute: 'suministro' },
    { name: 'N recibo', attribute: 'numero_recibo' },
    { name: 'Monto', attribute: 'monto' },
    { name: 'Titular', attribute: 'titular' },
    { name: 'Vigencia', attribute: 'estado_vigencia', config: { styleClass: true } },
    { name: 'Estado pago', attribute: 'estado_pago_text', config: { styleClass: true } },
    { name: 'Estado anulado', attribute: 'estado_anulado_label', config: { styleClass: true } },
    {
      name: 'Notificacion',
      attribute: 'notificacion_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    {
      name: 'Fecha pago',
      attribute: 'pago_at',
      config: {
        formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' }
      }
    },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          {
            hide: false,
            bgClass: 'gray',
            toolTip: 'Ver detalles',
            icon: 'visibility',
            value: 'view_detail'
          },
          {
            hide: false,
            bgClass: 'yellow',
            toolTip: 'Marcar devuelto',
            icon: 'undo',
            value: 'mark_returned'
          },
          {
            hide: false,
            bgClass: 'red',
            toolTip: 'Anular QR',
            icon: 'cancel',
            value: 'cancel_qr'
          }
        ]
      }
    }
  ];

  public reportForm!: FormGroup;
  public dataService: any[] = [];
  public dataFilter: any[] = [];
  public listFilters: any = {};
  public pageSize: any = 10;
  public page: number = 1;
  public count: number = null;
  public totalCount: number = 0;
  public totalAmount: number = 0;
  public totalPaidAmount: number = 0;
  public totalAnulados: number = 0;
  public totalVencidos: number = 0;
  public totalPagados: number = 0;
  public selectedRow: any = null;
  public detailQrImage: string = '';
  private detailDialogRef?: MatDialogRef<any>;
  private historyDialogRef?: MatDialogRef<any>;
  private markReturnedDialogRef?: MatDialogRef<any>;
  private cancelDialogRef?: MatDialogRef<any>;
  private cancelBlockedDialogRef?: MatDialogRef<any>;
  public notificationHistory: any = null;
  public notificationItems: any[] = [];
  public isLoadingHistory: boolean = false;
  public isMarkingReturned: boolean = false;
  public pendingReturnRow: any = null;
  public isCancelling: boolean = false;
  public cancelRow: any = null;
  public filteredServices: ServiceItem[] = [];
  public allItems: ServiceItem[] = [];
  public serviceFilter: string = '';
  public filterServiceSelected: ServiceItem | null = null;

  public estadoPagoOptions = [
    { value: '', label: 'NINGUNO' },
    { value: '0', label: 'pendiente' },
    { value: '1', label: 'pagado' },
    { value: '2', label: 'notificado no pagado' },
    { value: '3', label: 'fallido' }
  ];

  public estadoAnuladoOptions = [
    { value: '', label: 'NINGUNO' },
    { value: '0', label: 'vigente' },
    { value: '1', label: 'anulado' }
  ];

  public vigenciaOptions = [
    { value: '', label: 'NINGUNO' },
    { value: 'vigente', label: 'vigente' },
    { value: 'vencido', label: 'vencido' }
  ];

  @ViewChild('detailDialog') detailDialog!: TemplateRef<any>;
  @ViewChild('notificationHistoryDialog') notificationHistoryDialog!: TemplateRef<any>;
  @ViewChild('markReturnedDialog') markReturnedDialog!: TemplateRef<any>;
  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<any>;
  @ViewChild('cancelBlockedDialog') cancelBlockedDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private services: ServicesService,
    private generateQrService: GenerateQrService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.formReport();
    this.loadServices();
    this.loadReports();
  }

  formReport() {
    this.reportForm = this.fb.group({
      start: [''],
      end: [''],
      servicio: [''],
      suministro: [''],
      titular: [''],
      expiredFrom: [''],
      expiredTo: [''],
      vigencia: [''],
      estadoPago: [''],
      estadoAnulado: ['']
    }, { validators: [this.dateRangeValidator('start', 'end'), this.dateRangeValidator('expiredFrom', 'expiredTo')] });
  }

  onPageChange(event: PageEvent) {
    const sizeChanged = event.pageSize !== this.pageSize;
    this.pageSize = event.pageSize;
    this.page = event.pageIndex + 1;
    if (sizeChanged) {
      this.dataFilter = [];
      this.dataService = [];
    }
    this.loadReports();
  }

  searchData() {
    this.page = 1;
    this.dataFilter = [];
    this.listFilters = this.buildListFilters();
    this.loadReports();
  }

  clearFilters() {
    this.reportForm.reset();
    this.page = 1;
    this.dataFilter = [];
    this.listFilters = {};
    this.loadReports();
  }

  clickButton(event: any) {
    const { value, element } = event;
    if (value === 'view_detail') {
      this.openDetailDialog(element);
      return;
    }
    if (value === 'cancel_qr') {
      this.openCancelDialog(element);
      return;
    }
    if (value === 'mark_returned') {
      this.openMarkReturnedDialog(element);
    }
  }

  private openDetailDialog(row: any) {
    this.selectedRow = row;
    this.detailQrImage = '';
    this.buildDetailQrImage(row);
    this.detailDialogRef = this.dialog.open(this.detailDialog, {
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'qr-dialog'
    });
  }

  private async buildDetailQrImage(row: any) {
    const hash = row?.hash_qr;
    if (!hash) {
      this.detailQrImage = '';
      return;
    }
    try {
      this.detailQrImage = await QRCode.toDataURL(String(hash), { margin: 1, width: 220 });
    } catch (error) {
      console.error('Error generando QR desde hash_qr:', error);
      this.detailQrImage = '';
    }
  }



  loadServices() {
    // reutiliza el servicio de listado con tipo LUZ
    this.services.getServicesFromCategory('LUZ').subscribe({
      next: (response) => {
        const items = response?.data?.Items ?? response?.data?.items ?? response?.items ?? [];
        this.allItems = (items || []).map((item: any) => ({
          id: item.id,
          name: item.name
        }));
        this.filteredServices = [...this.allItems];
      },
      error: (err) => {
        console.error(err);
        this.filteredServices = [];
      }
    });
  }

  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  onFilterServiceChange(event: any) {
    const selectedName = event.value;
    const selectedObject = this.filteredServices.find(s => s.name === selectedName);
    this.filterServiceSelected = selectedObject ?? null;
    this.reportForm.get('servicio')?.setValue(selectedName || '');
  }

  get filterServiceName(): string {
    return this.filterServiceSelected?.name || '';
  }


  openNotificationHistory() {
    const idQr = this.selectedRow?.qr_id;
    if (!idQr) {
      this.mytoastr.showWarning('ID QR no disponible', '');
      return;
    }
    this.isLoadingHistory = true;
    this.notificationHistory = null;
    this.notificationItems = [];
    this.generateQrService.notificationHistory(String(idQr)).pipe(
      finalize(() => {
        this.isLoadingHistory = false;
      })
    ).subscribe({
      next: (data) => {
        this.notificationHistory = data;
        this.notificationItems = Array.isArray(data?.items) ? data.items : [];
        this.historyDialogRef = this.dialog.open(this.notificationHistoryDialog, {
          width: '900px',
          maxWidth: '96vw',
          panelClass: 'qr-dialog'
        });
      },
      error: (err) => {
        console.error(err);
        this.mytoastr.showError('Error al cargar historial', '');
      }
    });
  }

  formatJson(value: any): string {
    if (!value) {
      return '';
    }
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(value);
    }
  }

  private openCancelDialog(row: any) {
    this.cancelRow = row;
    const estadoPago = String(row?.estado_pago_text || '').toLowerCase();
    const estadoPagoRaw = row?.estado_pago_raw;
    if (estadoPago === 'pagado' || estadoPagoRaw === 1 || estadoPagoRaw === '1') {
      this.cancelBlockedDialogRef = this.dialog.open(this.cancelBlockedDialog, {
        width: '480px',
        maxWidth: '95vw',
        panelClass: 'qr-dialog'
      });
      return;
    }
    this.cancelDialogRef = this.dialog.open(this.cancelDialog, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'qr-dialog'
    });
  }

  confirmCancel() {
    if (!this.cancelRow?.qr_id || this.isCancelling) {
      return;
    }
    this.isCancelling = true;
    const responsable = this.getResponsable();
    this.generateQrService.cancelQr([String(this.cancelRow.qr_id)], responsable)
      .pipe(finalize(() => {
        this.isCancelling = false;
      }))
      .subscribe({
        next: () => {
          this.mytoastr.showSuccess('QR anulado', '');
          this.cancelDialogRef?.close();
          this.loadReports();
        },
        error: (err) => {
          console.error(err);
          this.mytoastr.showError('No se pudo anular el QR', '');
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

  private openMarkReturnedDialog(row: any) {
    this.pendingReturnRow = row;
    this.markReturnedDialogRef = this.dialog.open(this.markReturnedDialog, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'qr-dialog'
    });
  }

  confirmMarkReturned() {
    const idQr = this.pendingReturnRow?.qr_id;
    if (!idQr || this.isMarkingReturned) {
      return;
    }
    this.isMarkingReturned = true;
    const responsable = this.getResponsable();
    this.generateQrService.markReturned([String(idQr)], responsable)
      .pipe(finalize(() => {
        this.isMarkingReturned = false;
      }))
      .subscribe({
        next: () => {
          this.mytoastr.showWarning('Estado actualizado', '');
          this.markReturnedDialogRef?.close();
          this.loadReports();
        },
        error: (err) => {
          console.error(err);
          this.mytoastr.showError('Error al actualizar estado', '');
        }
      });
  }

  downloadDetailQrImage() {
    if (!this.detailQrImage) {
      return;
    }
    const suministro = this.selectedRow?.suministro || '';
    const servicio = this.selectedRow?.servicio || '';
    const titular = this.selectedRow?.titular || '';
    const fechaRaw = this.selectedRow?.qr_created_at || '';
    const fecha = String(fechaRaw).replace('T', '_').replace(/[:\s]/g, '-');
    const base = [suministro, servicio, titular, fecha]
      .filter(Boolean)
      .join('_')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'qr';
    const link = document.createElement('a');
    link.href = this.detailQrImage;
    link.download = `${base}.png`;
    link.click();
  }

  private loadReports() {
    this.spinner.spinnerOnOff();
    const page = this.page && this.page > 0 ? this.page : 1;
    this.generateQrService.listReports(page, this.pageSize, this.listFilters).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (data) => {
        const items = Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];
        const normalized = items.map((item: any) => this.normalizeReport(item));
        this.dataFilter = normalized;
        this.dataService = [...this.dataFilter];
        this.count = data?.total ?? data?.data?.total ?? normalized.length;
        this.totalCount = data?.totals?.count ?? data?.totals?.total ?? this.count ?? 0;
        this.totalAmount = data?.totals?.amount ?? 0;
        this.totalPaidAmount = data?.totals?.paidAmount ?? 0;
        this.totalAnulados = data?.totals?.anulados ?? 0;
        this.totalVencidos = data?.totals?.vencidos ?? 0;
        this.totalPagados = data?.totals?.pagados ?? 0;
      },
      error: (err) => {
        console.error(err);
        this.mytoastr.showError('Error al cargar reportes', '');
      }
    });
  }

  private normalizeReport(item: any) {
    const estadoPagoRaw = item?.estado_pago ?? item?.estadoPago ?? item?.estado;
    const estadoPagoLabel = this.formatEstadoPago(estadoPagoRaw);
    const estadoAnuladoLabel = this.formatEstadoAnulado(item?.estado_anulado ?? item?.estadoAnulado);
    const vigenciaLabel = estadoAnuladoLabel === 'anulado' ? 'vencido' : this.formatVigencia(item?.estado_vigencia ?? item?.vigencia);
    return {
      qr_id: item?.qr_id ?? item?.id_qr ?? item?.idQr ?? item?.id,
      hash_qr: item?.hash_qr ?? item?.hash ?? item?.qrHash,
      qr_created_at: item?.qr_created_at ?? item?.created_at ?? item?.createdAt ?? item?.fecha_generacion,
      servicio: item?.servicio ?? item?.service ?? item?.empresa ?? item?.service_name,
      suministro: item?.suministro ?? item?.supply ?? item?.codigo_usuario,
      monto: this.normalizeAmount(item?.monto ?? item?.amount),
      titular: item?.titular ?? item?.cliente ?? item?.customer ?? item?.client_name,
      qr_expired_at: item?.qr_expired_at ?? item?.expired_at ?? item?.expiredAt ?? item?.fecha_vencimiento,
      numero_recibo: item?.numero_recibo ?? item?.receipt_number ?? item?.recibo ?? '',
      estado_vigencia: vigenciaLabel,
      estado_pago_text: item?.estado_pago_text ?? estadoPagoLabel,
      estado_pago_raw: estadoPagoRaw,
      estado_anulado_label: estadoAnuladoLabel,
      notificacion_at: item?.notificacion_at ?? item?.notified_at ?? item?.fecha_notificacion,
      pago_at: item?.pago_at ?? item?.paid_at ?? item?.fecha_pago,
      qr_image_path: item?.qr_image_path
    };
  }

  private formatEstadoPago(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      switch (num) {
        case 0:
          return 'pendiente qr generado';
        case 1:
          return 'pendiente sin pagar';
        case 2:
          return 'pagado';
        case 3:
          return 'fallido';
        default:
          return String(value).toLowerCase();
      }
    }
    const lower = String(value).toLowerCase().replace(/_/g, ' ');
    return lower;
  }

  private formatEstadoAnulado(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return num === 1 ? 'anulado' : 'vigente';
    }
    return String(value).toLowerCase().replace(/_/g, ' ');
  }

  private formatVigencia(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value).toLowerCase().replace(/_/g, ' ');
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

  private buildListFilters(): Record<string, any> {
    const filters: Record<string, any> = {};
    const get = (key: string) => String(this.reportForm?.get(key)?.value || '').trim();
    const start = this.formatDateParam(this.reportForm?.get('start')?.value);
    const end = this.formatDateParam(this.reportForm?.get('end')?.value);
    const expiredFrom = this.formatDateParam(this.reportForm?.get('expiredFrom')?.value);
    const expiredTo = this.formatDateParam(this.reportForm?.get('expiredTo')?.value);

    if (start) filters['start'] = start;
    if (end) filters['end'] = end;

    const servicio = get('servicio');
    const suministro = get('suministro');
    const titular = get('titular');
    const vigencia = get('vigencia');
    const estadoPago = get('estadoPago');
    const estadoAnulado = get('estadoAnulado');

    if (servicio) filters['servicio'] = servicio;
    if (suministro) filters['suministro'] = suministro;
    if (titular) filters['cliente'] = titular;
    if (expiredFrom) filters['expiredFrom'] = expiredFrom;
    if (expiredTo) filters['expiredTo'] = expiredTo;
    if (vigencia) filters['vigencia'] = vigencia;
    if (estadoPago) filters['estadoPago'] = estadoPago;
    if (estadoAnulado) filters['estadoAnulado'] = estadoAnulado;

    return filters;
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


  public formatDateTimeDisplay(value: any): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ');
    }
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
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
}
