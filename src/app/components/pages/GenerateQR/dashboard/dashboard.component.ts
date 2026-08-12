import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize, Subscription } from 'rxjs';
import {
  GenerateQrService,
  QrSummaryByServiceItem
} from 'src/app/services/generateqr.service';
import { ServicesService } from 'src/app/services/services.service';
import { environment } from 'src/environments/environment';

interface ServiceItem {
  id: string;
  name: string;
}

@Component({
  selector: 'uni-generateqr-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class GenerateQrDashboardComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  pageIndex = 0;
  pageSize = 6;
  totalReports = 0;
  reports: QrSummaryByServiceItem[] = [];
  allServices: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];
  serviceFilter = '';
  isLoading = false;
  loadError = '';
  private summaryRequest?: Subscription;

  constructor(
    private fb: FormBuilder,
    private generateQrService: GenerateQrService,
    private servicesService: ServicesService
  ) {}

  ngOnInit(): void {
    const today = new Date();

    this.reportForm = this.fb.group({
      paymentFrom: [today, Validators.required],
      paymentTo: [today, Validators.required],
      serviceId: ['']
    }, { validators: this.dateRangeValidator('paymentFrom', 'paymentTo') });

    this.loadServices();
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.summaryRequest?.unsubscribe();
  }

  clearFilters(): void {
    const today = new Date();
    this.reportForm.reset({
      paymentFrom: today,
      paymentTo: today,
      serviceId: ''
    });
    this.serviceFilter = '';
    this.filteredServices = [...this.allServices];
    this.pageIndex = 0;
    this.loadSummary();
  }

  searchData(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.pageIndex = 0;
    this.loadSummary();
  }

  paymentPercentage(report: QrSummaryByServiceItem): number {
    return report.generated > 0
      ? Math.round((report.paid / report.generated) * 100)
      : 0;
  }

  barHeight(value: number, report: QrSummaryByServiceItem): number {
    if (!value) {
      return 2;
    }
    const maximum = Math.max(report.paid, report.pending, report.expired, report.cancelled, 1);
    return 18 + Math.round((value / maximum) * 58);
  }

  onReportPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSummary();
  }

  filterServices(): void {
    const value = this.serviceFilter.trim().toLowerCase();
    this.filteredServices = this.allServices.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  private loadServices(): void {
    this.servicesService.getServices(
      '',
      'HABILITADO',
      '',
      '',
      0,
      environment.URL_API_SERVICES_IDCLIENT,
      200
    ).subscribe({
      next: (response) => {
        const items = response?.data?.Items ?? [];
        this.allServices = items
          .map((item: any) => ({ id: String(item.id), name: String(item.name || '') }))
          .filter((service: ServiceItem) => Boolean(service.id && service.name));
        this.filteredServices = [...this.allServices];
      },
      error: () => {
        this.allServices = [];
        this.filteredServices = [];
      }
    });
  }

  private loadSummary(): void {
    if (!this.reportForm || this.reportForm.invalid) {
      return;
    }

    const queryFrom = this.formatDateParam(this.reportForm.get('paymentFrom')?.value);
    const queryTo = this.formatDateParam(this.reportForm.get('paymentTo')?.value);
    const serviceId = String(this.reportForm.get('serviceId')?.value || '');

    this.summaryRequest?.unsubscribe();
    this.isLoading = true;
    this.loadError = '';

    this.summaryRequest = this.generateQrService.getQrSummaryByService(
      queryFrom,
      queryTo,
      this.pageIndex + 1,
      this.pageSize,
      serviceId
    ).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.reports = Array.isArray(response?.items) ? response.items : [];
        this.totalReports = Number(response?.total) || 0;
      },
      error: () => {
        this.reports = [];
        this.totalReports = 0;
        this.loadError = 'No se pudo cargar el resumen de QRs. Inténtalo nuevamente.';
      }
    });
  }

  private formatDateParam(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private dateRangeValidator(fromControl: string, toControl: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const from = group.get(fromControl)?.value;
      const to = group.get(toControl)?.value;
      return from && to && new Date(from) > new Date(to) ? { invalidDateRange: true } : null;
    };
  }
}
