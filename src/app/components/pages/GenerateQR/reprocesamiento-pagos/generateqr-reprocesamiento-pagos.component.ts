import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { EMPTY } from 'rxjs';
import { expand, finalize, map, scan } from 'rxjs/operators';
import { GenerateQrService } from 'src/app/services/generateqr.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

interface ServiceItem {
  id: string;
  name: string;
}

@Component({
  selector: 'uni-generateqr-reprocesamiento-pagos',
  templateUrl: './generateqr-reprocesamiento-pagos.component.html',
  styleUrls: ['./generateqr-reprocesamiento-pagos.component.scss']
})
export class GenerateQrReprocesamientoPagosComponent implements OnInit {
  @ViewChild('scheduleDialog') scheduleDialog!: TemplateRef<any> | null;
  private scheduleDialogRef?: MatDialogRef<any>;
  @ViewChild('historyDialog') historyDialog!: TemplateRef<any> | null;
  private historyDialogRef?: MatDialogRef<any>;
  scheduleForm: FormGroup;
  queueForm: FormGroup;

  scheduleColumns: any[] = [
    { name: 'Servicio', attribute: 'service' },
    { name: 'Hora apertura', attribute: 'open_time' },
    { name: 'Hora cierre', attribute: 'close_time' },
    { name: 'Timezone', attribute: 'timezone' },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          { hide: false, bgClass: 'gray', toolTip: 'Editar', icon: 'edit', value: 'edit' },
          { hide: false, bgClass: 'red', toolTip: 'Eliminar', icon: 'delete', value: 'delete' }
        ]
      }
    }
  ];
  scheduleData: any[] = [];
  editingServiceId: string | null = null;
  queueColumns: any[] = [
    { name: 'Instruction ID', attribute: 'instruction_id' },
    { name: 'ID QR', attribute: 'id_qr' },
    { name: 'Service ID', attribute: 'service_id' },
    { name: 'Suministro', attribute: 'supply_number' },
    { name: 'Monto', attribute: 'amount' },
    { name: 'Estado', attribute: 'status', config: { styleClass: true } },
    { name: 'Intentos', attribute: 'attempt_count' },
    {
      name: 'Próximo intento',
      attribute: 'next_attempt_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Último intento',
      attribute: 'last_attempt_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    { name: 'Responsable', attribute: 'responsable' },
    {
      name: 'Creado',
      attribute: 'created_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          { hide: false, bgClass: 'gray', toolTip: 'Ver historial', icon: 'visibility', value: 'view_history' }
        ]
      }
    }
  ];
  queueData: any[] = [];
  queuePage = 1;
  queuePageSize = 20;
  queueTotal = 0;
  todayStats: any = { pending: 0, processing: 0, success: 0, failed: 0, skipped: 0 };
  historyData: any[] = [];
  historyPage = 1;
  historyPageSize = 20;
  historyTotal = 0;
  historyQueueId: string | null = null;

  serviceFilter = '';
  allServices: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];
  selectedServiceName = '';

  scheduleItems: any[] = [];
  page = 1;
  pageSize = 50;
  total = 0;
  isLoading = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private services: ServicesService,
    private generateQrService: GenerateQrService,
    private spinner: SpinnerService,
    private toastr: MytoastrService,
    private dialog: MatDialog
  ) {
    this.scheduleForm = this.fb.group({
      serviceName: ['', Validators.required],
      open_time: ['', Validators.required],
      close_time: ['', Validators.required],
    });

    this.queueForm = this.fb.group({
      status: [''],
      instructionId: [''],
      serviceId: [''],
      idQr: [''],
      supplyNumber: [''],
      responsable: [''],
      dateFrom: [''],
      dateTo: [''],
      minAmount: [''],
      maxAmount: ['']
    });
  }

  openScheduleDialog() {
    if (!this.scheduleDialog) {
      return;
    }
    this.scheduleDialogRef = this.dialog.open(this.scheduleDialog, {
      width: '980px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'service-schedule-dialog'
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadSchedules();
    this.loadQueue();
  }

  loadServices(): void {
    this.spinner.spinnerOnOff();
    this.services.getServicesFromCategory('LUZ').pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.services.getServicesFromCategory('LUZ', response.data.nextPageKey)
          : EMPTY
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc: ServiceItem[], items: ServiceItem[]) => acc.concat(items), []),
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (items: ServiceItem[]) => {
        this.allServices = items;
        this.filteredServices = items;
        this.filterServices();
      },
      error: (error) => {
        this.toastr.handleHttpError(error);
      }
    });
  }

  filterServices(): void {
    const term = (this.serviceFilter || '').toLowerCase();
    this.filteredServices = this.allServices.filter(service =>
      service.name?.toLowerCase().includes(term)
    );
  }

  onServiceChange(event: any): void {
    this.selectedServiceName = event?.value || '';
  }

  loadSchedules(): void {
    this.isLoading = true;
    const serviceName = this.scheduleForm.get('serviceName')?.value || '';
    this.generateQrService.listServiceSchedule(this.page, this.pageSize, serviceName).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        this.scheduleItems = response?.items ?? [];
        this.scheduleData = this.scheduleItems.map((item: any) => ({
          service_id: item.service_id || item.serviceId || item.id || item.service || '',
          service: item.serviceName || item.service_name || item.service || item.service_id || '-',
          open_time: item.open_time || '-',
          close_time: item.close_time || '-',
          timezone: item.timezone || 'America/Lima'
        }));
        this.total = response?.total ?? 0;
      },
      error: (error) => {
        this.toastr.handleHttpError(error);
      }
    });
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid || this.isSaving) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = {
      serviceName: this.scheduleForm.get('serviceName')?.value,
      open_time: this.scheduleForm.get('open_time')?.value,
      close_time: this.scheduleForm.get('close_time')?.value,
      timezone: 'America/Lima'
    };

    const request$ = this.editingServiceId
      ? this.generateQrService.updateServiceSchedule(this.editingServiceId, payload)
      : this.generateQrService.createServiceSchedule(payload);

    request$.pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: () => {
        this.toastr.showSuccess('OK', this.editingServiceId ? 'Horario actualizado' : 'Horario registrado');
        this.editingServiceId = null;
        this.clearForm();
        this.loadSchedules();
    this.loadQueue();
      },
      error: (error) => {
        this.toastr.handleHttpError(error);
      }
    });
  }

  onScheduleAction(event: any) {
    const action = event?.action || event?.value || event?.event || event?.type;
    const row = event?.element || event?.row || event?.data || event;
    if (!row) {
      return;
    }

    if (action === 'edit') {
      const serviceName = row.service || row.serviceName || row.service_name || row.service_id || '';
      this.editingServiceId = this.getServiceId(row);
      this.scheduleForm.patchValue({
        serviceName,
        open_time: row.open_time || '',
        close_time: row.close_time || ''
      });
      this.selectedServiceName = serviceName;
      this.serviceFilter = '';
      if (!this.scheduleDialogRef) {
        this.openScheduleDialog();
      }
      return;
    }

    if (action === 'delete') {
      const serviceId = this.getServiceId(row);
      if (!serviceId) {
        return;
      }
      if (!confirm('?Seguro que deseas eliminar este horario?')) {
        return;
      }
      this.generateQrService.deleteServiceSchedule(serviceId).subscribe({
        next: () => {
          this.toastr.showSuccess('OK', 'Horario eliminado');
          this.loadSchedules();
    this.loadQueue();
        },
        error: (error) => this.toastr.handleHttpError(error)
      });
    }
  }

  getServiceId(row: any): string {
    return row.service_id || row.serviceId || row.id || '';
  }

  onPageChange(event: PageEvent) {
    const sizeChanged = event.pageSize !== this.pageSize;
    this.pageSize = event.pageSize;
    this.page = event.pageIndex + 1;
    if (sizeChanged) {
      this.page = 1;
    }
    this.loadSchedules();
    this.loadQueue();
  }

  clearForm(): void {
    this.scheduleForm.reset({
      serviceName: '',
      open_time: '',
      close_time: '',
    });
    this.selectedServiceName = '';
    this.serviceFilter = '';
    this.filterServices();
  }

  private formatDateParam(value: any): string {
    if (!value) {
      return '';
    }
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof value === 'string' && value.includes('T')) {
      return value.split('T')[0];
    }
    return String(value);
  }

  clearQueueFilters(): void {
    this.queueForm.reset({
      status: '',
      instructionId: '',
      serviceId: '',
      idQr: '',
      supplyNumber: '',
      responsable: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
    this.queuePage = 1;
    this.loadQueue();
  }

  loadQueue(): void {
    const formValue = this.queueForm.getRawValue();
    const filters: Record<string, any> = {
      status: formValue.status || undefined,
      instructionId: formValue.instructionId || undefined,
      serviceId: formValue.serviceId || undefined,
      idQr: formValue.idQr || undefined,
      supplyNumber: formValue.supplyNumber || undefined,
      responsable: formValue.responsable || undefined,
      dateFrom: this.formatDateParam(formValue.dateFrom) || undefined,
      dateTo: this.formatDateParam(formValue.dateTo) || undefined,
      minAmount: formValue.minAmount || undefined,
      maxAmount: formValue.maxAmount || undefined
    };

    this.spinner.spinnerOnOff();
    this.generateQrService.listReprocessQueue(this.queuePage, this.queuePageSize, filters).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (response) => {
        this.queueTotal = response?.total ?? 0;
        const items = Array.isArray(response?.items) ? response.items : [];
        this.queueData = items.map((item: any) => ({
          ...item,
          status: item.status || '-',
          styleClass: String(item.status || '').toLowerCase(),
          amount: item.amount ?? '-',
          attempt_count: item.attempt_count ?? '-',
          next_attempt_at: item.next_attempt_at || null,
          last_attempt_at: item.last_attempt_at || null,
          created_at: item.created_at || null
        }));
        this.todayStats = response?.today ?? {
          pending: 0,
          processing: 0,
          success: 0,
          failed: 0,
          skipped: 0
        };
      },
      error: (error) => this.toastr.handleHttpError(error)
    });
  }

  onQueuePageChange(event: PageEvent): void {
    const sizeChanged = event.pageSize !== this.queuePageSize;
    this.queuePageSize = event.pageSize;
    this.queuePage = event.pageIndex + 1;
    if (sizeChanged) {
      this.queuePage = 1;
    }
    this.loadQueue();
  }

  onQueueAction(event: any): void {
    const action = event?.action || event?.value || event?.event || event?.type;
    const row = event?.element || event?.row || event?.data || event;
    if (action !== 'view_history' || !row) {
      return;
    }
    this.openHistory(row);
  }

  private openHistory(row: any): void {
    const queueId = row?.queue_id || row?.id || row?.queueId;
    if (!queueId) {
      return;
    }
    this.historyQueueId = String(queueId);
    this.historyPage = 1;
    this.historyData = [];
    this.historyTotal = 0;
    if (!this.historyDialog) {
      return;
    }
    this.historyDialogRef = this.dialog.open(this.historyDialog, {
      width: '980px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'service-schedule-dialog'
    });
    this.loadHistory();
  }

  private loadHistory(): void {
    if (!this.historyQueueId) {
      return;
    }
    this.spinner.spinnerOnOff();
    this.generateQrService.listReprocessHistory(this.historyPage, this.historyPageSize, {
      queueId: this.historyQueueId
    }).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (response) => {
        this.historyTotal = response?.total ?? 0;
        const items = Array.isArray(response?.items) ? response.items : [];
        this.historyData = items.map((item: any) => ({
          ...item,
          status: item.status || '-',
          styleClass: String(item.status || '').toLowerCase(),
          created_at: item.created_at || null
        }));
      },
      error: (error) => this.toastr.handleHttpError(error)
    });
  }

  onHistoryPageChange(event: PageEvent): void {
    const sizeChanged = event.pageSize !== this.historyPageSize;
    this.historyPageSize = event.pageSize;
    this.historyPage = event.pageIndex + 1;
    if (sizeChanged) {
      this.historyPage = 1;
    }
    this.loadHistory();
  }
}
