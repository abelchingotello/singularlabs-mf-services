import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { GenerateQrService } from 'src/app/services/generateqr.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'uni-generateqr-sftp-servicios',
  templateUrl: './generateqr-sftp-servicios.component.html',
  styleUrls: ['./generateqr-sftp-servicios.component.scss']
})
export class GenerateQrSftpServiciosComponent implements OnInit {
  public isLoadingServices = false;
  public isRegisteringService = false;
  public isSavingConfiguredService = false;
  public ligopayServices: any[] = [];
  public qrConfiguredServices: any[] = [];
  public ligopayResponse: any = null;
  public qrConfiguredResponse: any = null;
  public selectedLigopayService: any = null;
  public selectedQrConfiguredService: any = null;
  public readonly serviceClientId = environment.URL_API_SERVICES_IDCLIENT;
  private readonly serviceLimit = 200;
  private readonly qrServicePage = 1;
  private readonly qrServicePageSize = 50;

  @ViewChild('providerDialog') providerDialog!: TemplateRef<any>;
  @ViewChild('providerDetailDialog') providerDetailDialog!: TemplateRef<any>;
  @ViewChild('configuredServiceDialog') configuredServiceDialog!: TemplateRef<any>;
  @ViewChild('notificationEmailDialog') notificationEmailDialog!: TemplateRef<any>;
  private providerDialogRef?: MatDialogRef<any>;
  private providerDetailDialogRef?: MatDialogRef<any>;
  private configuredServiceDialogRef?: MatDialogRef<any>;
  private notificationEmailDialogRef?: MatDialogRef<any>;

  public providerForm: FormGroup;
  public configuredServiceForm: FormGroup;
  public notificationEmailFiltersForm: FormGroup;
  public notificationEmailForm: FormGroup;
  public isLoadingProviders = false;
  public isSavingProvider = false;
  public providerPage = 1;
  public providerPageSize = 10;
  public providerTotal = 0;
  public editingProviderId: number | null = null;
  public selectedProviderDetail: any = null;
  public selectedServiceNameToMap = '';
  public isSavingMapping = false;
  public providerRows: any[] = [];
  public isLoadingNotificationEmails = false;
  public isSavingNotificationEmail = false;
  public editingNotificationEmailId: number | null = null;
  public notificationEmailPage = 1;
  public notificationEmailPageSize = 10;
  public notificationEmailTotal = 0;
  public notificationEmailRows: any[] = [];
  public notificationEmailColumns: any[] = [
    { name: 'Correo', attribute: 'email' },
    { name: 'Tipo', attribute: 'scopeText', config: { styleClass: true } },
    { name: 'Servicio', attribute: 'serviceNameDisplay' },
    { name: 'Estado', attribute: 'activeText', config: { styleClass: true } },
    { name: 'Descripcion', attribute: 'description' },
    {
      name: 'Creado',
      attribute: 'created_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Actualizado',
      attribute: 'updated_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          { hide: false, bgClass: 'gray', toolTip: 'Editar correo', icon: 'edit', value: 'edit' },
          { hide: false, bgClass: 'red', toolTip: 'Eliminar correo', icon: 'delete', value: 'delete' }
        ]
      }
    }
  ];
  public providerColumns: any[] = [
    { name: 'Codigo', attribute: 'provider_code' },
    { name: 'Nombre', attribute: 'name' },
    { name: 'Usuario', attribute: 'username' },
    { name: 'Password', attribute: 'password_masked' },
    { name: 'Base dir', attribute: 'base_dir' },
    { name: 'Estado', attribute: 'active_text', config: { styleClass: true } },
    { name: 'Mapeos', attribute: 'serviceMappingsCount' },
    { name: 'Servicios relacionados', attribute: 'serviceMappingsSummary' },
    {
      name: 'Creado',
      attribute: 'created_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Actualizado',
      attribute: 'updated_at',
      config: { formatDate: { format: 'dd/MM/yyyy HH:mm', locale: 'en-US' } }
    },
    {
      name: 'Acciones',
      attribute: '',
      config: {
        type: 'buttonicons',
        actions: [
          { hide: false, bgClass: 'blue', toolTip: 'Ver detalle', icon: 'visibility', value: 'view' },
          { hide: false, bgClass: 'gray', toolTip: 'Editar provider', icon: 'edit', value: 'edit' }
        ]
      }
    }
  ];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private servicesService: ServicesService,
    private generateQrService: GenerateQrService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService
  ) {
    this.providerForm = this.fb.group({
      providerCode: ['', Validators.required],
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      baseDir: [''],
      port: [''],
      active: [1, Validators.required]
    });

    this.configuredServiceForm = this.fb.group({
      serviceId: [{ value: '', disabled: true }],
      serviceName: ['', Validators.required],
      businessCode: [''],
      webhookUrl: [''],
      webhookEnabled: [0],
      skipPagos: [0],
      qrTtlMinutes: ['']
    });

    this.notificationEmailFiltersForm = this.fb.group({
      email: [''],
      serviceId: [''],
      includeGlobal: [1],
      active: ['']
    });

    this.notificationEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      serviceId: [''],
      active: [1, Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadProviders();
    this.loadNotificationEmails();
  }

  loadServices(): void {
    if (this.isLoadingServices) {
      return;
    }

    console.log('[SFTP SERVICIOS REQUEST][LIGOPAY]', {
      endpoint: '/services',
      params: {
        count: 0,
        limit: this.serviceLimit,
        idclient: this.serviceClientId
      }
    });

    console.log('[SFTP SERVICIOS REQUEST][QR CONFIGURADOS]', {
      endpoint: '/v1/services-config',
      params: {
        page: this.qrServicePage,
        pageSize: this.qrServicePageSize
      }
    });

    this.isLoadingServices = true;

    forkJoin({
      ligopay: this.servicesService.getServicesByClientIdLowercase(this.serviceClientId, 0, this.serviceLimit).pipe(
        catchError((error) => {
          console.error('[SFTP SERVICIOS ERROR][LIGOPAY]', error);
          return of(null);
        })
      ),
      qrConfigured: this.generateQrService.listConfiguredServices(this.qrServicePage, this.qrServicePageSize).pipe(
        catchError((error) => {
          console.error('[SFTP SERVICIOS ERROR][QR CONFIGURADOS]', error);
          return of(null);
        })
      )
    })
      .pipe(finalize(() => {
        this.isLoadingServices = false;
      }))
      .subscribe(({ ligopay, qrConfigured }) => {
        this.ligopayResponse = ligopay;
        this.qrConfiguredResponse = qrConfigured;

        console.log('[SFTP SERVICIOS RESPONSE][LIGOPAY]', ligopay);
        console.log('[SFTP SERVICIOS RESPONSE][QR CONFIGURADOS]', qrConfigured);

        this.ligopayServices = this.extractItems(ligopay);
        this.qrConfiguredServices = this.extractItems(qrConfigured);

        if (this.selectedLigopayService && !this.ligopayServices.some(item => this.isSameService(item, this.selectedLigopayService))) {
          this.selectedLigopayService = null;
        }

        if (this.selectedQrConfiguredService) {
          const matchedConfigured = this.qrConfiguredServices.find(item => this.getQrConfiguredServiceId(item) === this.getQrConfiguredServiceId(this.selectedQrConfiguredService));
          this.selectedQrConfiguredService = matchedConfigured || null;
        }

        this.notificationEmailRows = (this.notificationEmailRows || []).map((item: any) => ({
          ...item,
          serviceNameDisplay: this.resolveNotificationServiceName(item)
        }));

        if (!ligopay && !qrConfigured) {
          this.mytoastr.showError('No se pudieron consultar los servicios', '');
        }
      });
  }

  selectLigopayService(service: any): void {
    if (this.isServiceConfigured(service)) {
      return;
    }
    this.selectedLigopayService = service;
  }

  selectQrConfiguredService(service: any): void {
    this.selectedQrConfiguredService = this.selectedQrConfiguredService === service ? null : service;
  }

  private isQrConfiguredServiceActive(service: any): boolean {
    return service?.active === true || Number(service?.active) === 1;
  }

  isQrServiceReady(service: any): boolean {
    return this.isQrConfiguredServiceActive(service);
  }

  isQrServiceWarning(service: any): boolean {
    return !this.isQrConfiguredServiceActive(service);
  }

  isQrServiceDanger(_: any): boolean {
    return false;
  }

  openConfiguredServiceDialog(): void {
    if (!this.selectedQrConfiguredService) {
      return;
    }

    this.configuredServiceForm.reset({
      serviceId: this.getQrConfiguredServiceId(this.selectedQrConfiguredService),
      serviceName: this.getQrConfiguredServiceName(this.selectedQrConfiguredService),
      businessCode: this.selectedQrConfiguredService?.businessCode || this.selectedQrConfiguredService?.business_code || '',
      webhookUrl: this.selectedQrConfiguredService?.webhookUrl || this.selectedQrConfiguredService?.webhook_url || '',
      webhookEnabled: Number(this.selectedQrConfiguredService?.webhookEnabled ?? this.selectedQrConfiguredService?.webhook_enabled ?? 0),
      skipPagos: Number(this.selectedQrConfiguredService?.skipPagos ?? this.selectedQrConfiguredService?.skip_pagos ?? 0),
      qrTtlMinutes: this.selectedQrConfiguredService?.qrTtlMinutes || this.selectedQrConfiguredService?.qr_ttl_minutes || ''
    });

    this.configuredServiceDialogRef = this.dialog.open(this.configuredServiceDialog, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'provider-config-dialog'
    });
  }

  saveConfiguredService(): void {
    if (!this.selectedQrConfiguredService || this.configuredServiceForm.invalid || this.isSavingConfiguredService) {
      this.configuredServiceForm.markAllAsTouched();
      return;
    }

    const serviceId = this.getQrConfiguredServiceId(this.selectedQrConfiguredService);
    if (!serviceId) {
      this.mytoastr.showWarning('Servicio invalido', 'No se pudo obtener el identificador del servicio');
      return;
    }

    const payload = {
      serviceName: this.configuredServiceForm.get('serviceName')?.value,
      businessCode: this.configuredServiceForm.get('businessCode')?.value,
      webhookUrl: this.configuredServiceForm.get('webhookUrl')?.value || null,
      webhookEnabled: Number(this.configuredServiceForm.get('webhookEnabled')?.value ?? 0),
      skipPagos: Number(this.configuredServiceForm.get('skipPagos')?.value ?? 0),
      qrTtlMinutes: Number(this.configuredServiceForm.get('qrTtlMinutes')?.value || 0)
    };

    console.log('[SFTP SERVICIOS REQUEST][UPDATE SERVICE]', { serviceId, payload });

    this.isSavingConfiguredService = true;
    this.spinner.spinnerOnOff();
    this.generateQrService.updateConfiguredService(serviceId, payload)
      .pipe(finalize(() => {
        this.isSavingConfiguredService = false;
        this.spinner.spinnerOnOff();
      }))
      .subscribe({
        next: (response) => {
          console.log('[SFTP SERVICIOS RESPONSE][UPDATE SERVICE]', response);

          const updatedItem = {
            ...(this.selectedQrConfiguredService || {}),
            ...(response?.item || response?.data || response || {}),
            serviceId,
            serviceName: payload.serviceName,
            businessCode: payload.businessCode,
            webhookUrl: payload.webhookUrl,
            webhookEnabled: payload.webhookEnabled,
            skipPagos: payload.skipPagos,
            qrTtlMinutes: payload.qrTtlMinutes
          };

          this.qrConfiguredServices = (this.qrConfiguredServices || []).map((item: any) =>
            this.getQrConfiguredServiceId(item) === serviceId ? { ...item, ...updatedItem } : item
          );
          this.selectedQrConfiguredService = updatedItem;

          this.mytoastr.showSuccess('Servicio actualizado', payload.serviceName);
          this.configuredServiceDialogRef?.close();
        },
        error: (error) => {
          console.error('[SFTP SERVICIOS ERROR][UPDATE SERVICE]', error);
          this.mytoastr.showError('No se pudo actualizar el servicio', '');
        }
      });
  }

  registerService(): void {
    if (!this.selectedLigopayService || this.isRegisteringService) {
      return;
    }

    const serviceName = this.getLigopayServiceName(this.selectedLigopayService);
    if (!serviceName) {
      this.mytoastr.showWarning('Servicio invalido', 'No se pudo obtener el nombre del servicio');
      return;
    }

    console.log('[SFTP SERVICIOS REQUEST][REGISTER]', { serviceName });

    this.isRegisteringService = true;
    this.spinner.spinnerOnOff();

    this.generateQrService.registerConfiguredService(serviceName)
      .pipe(finalize(() => {
        this.isRegisteringService = false;
        this.spinner.spinnerOnOff();
      }))
      .subscribe({
        next: (response) => {
          console.log('[SFTP SERVICIOS RESPONSE][REGISTER]', response);
          this.mytoastr.showSuccess('Servicio registrado', serviceName);
          this.selectedLigopayService = null;
          this.loadServices();
        },
        error: (error) => {
          console.error('[SFTP SERVICIOS ERROR][REGISTER]', error);
          this.mytoastr.showError('No se pudo registrar el servicio', '');
        }
      });
  }

  isServiceConfigured(service: any): boolean {
    const serviceName = this.normalizeText(this.getLigopayServiceName(service));
    return this.qrConfiguredServices.some(item => this.normalizeText(this.getQrConfiguredServiceName(item)) === serviceName);
  }

  openProviderDialog(row?: any): void {
    const providerId = row?.id ?? null;

    if (!providerId) {
      this.editingProviderId = null;
      this.providerForm.reset({
        providerCode: '',
        name: '',
        username: '',
        password: '',
        baseDir: '',
        port: '',
        active: 1
      });
      this.providerDialogRef = this.dialog.open(this.providerDialog, {
        width: '720px',
        maxWidth: '95vw',
        panelClass: 'provider-config-dialog'
      });
      return;
    }

    this.spinner.spinnerOnOff();
    this.generateQrService.getSftpProviderConfig(providerId).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (response) => {
        console.log('[SFTP PROVIDER RESPONSE][DETAIL]', response);
        const item = response?.item || response?.data || response;
        this.editingProviderId = item?.id ?? providerId;
        this.providerForm.reset({
          providerCode: item?.provider_code || item?.providerCode || '',
          name: item?.name || '',
          username: item?.username || '',
          password: item?.password || '',
          baseDir: item?.base_dir || item?.baseDir || '',
          port: item?.port ?? '',
          active: item?.active ?? 1
        });
        this.providerDialogRef = this.dialog.open(this.providerDialog, {
          width: '720px',
          maxWidth: '95vw',
          panelClass: 'provider-config-dialog'
        });
      },
      error: (error) => {
        console.error('[SFTP PROVIDER ERROR][DETAIL]', error);
        this.mytoastr.showError('No se pudo cargar el provider', '');
      }
    });
  }

  saveProvider(): void {
    if (this.providerForm.invalid || this.isSavingProvider) {
      this.providerForm.markAllAsTouched();
      return;
    }

    const portValue = this.providerForm.get('port')?.value;
    const payload = {
      providerCode: this.providerForm.get('providerCode')?.value,
      name: this.providerForm.get('name')?.value,
      username: this.providerForm.get('username')?.value,
      password: this.providerForm.get('password')?.value,
      baseDir: this.providerForm.get('baseDir')?.value || '',
      port: portValue === '' || portValue === null || portValue === undefined ? null : Number(portValue),
      active: Number(this.providerForm.get('active')?.value ?? 1)
    };

    console.log('[SFTP PROVIDER REQUEST][SAVE]', {
      mode: this.editingProviderId ? 'edit' : 'create',
      providerId: this.editingProviderId,
      payload
    });

    this.isSavingProvider = true;
    this.spinner.spinnerOnOff();

    const request$ = this.editingProviderId
      ? this.generateQrService.updateSftpProviderConfig(this.editingProviderId, payload)
      : this.generateQrService.createSftpProviderConfig(payload);

    request$.pipe(
      finalize(() => {
        this.isSavingProvider = false;
        this.spinner.spinnerOnOff();
      })
    ).subscribe({
      next: (response) => {
        console.log('[SFTP PROVIDER RESPONSE][SAVE]', response);
        this.mytoastr.showSuccess(
          this.editingProviderId ? 'Provider actualizado' : 'Provider registrado',
          payload.name
        );
        this.providerDialogRef?.close();
        this.editingProviderId = null;
        this.loadProviders();
      },
      error: (error) => {
        console.error('[SFTP PROVIDER ERROR][SAVE]', error);
        this.mytoastr.showError('No se pudo guardar el provider', '');
      }
    });
  }

  loadProviders(): void {
    if (this.isLoadingProviders) {
      return;
    }

    this.isLoadingProviders = true;
    console.log('[SFTP PROVIDER REQUEST][LIST]', {
      endpoint: '/v1/sftp/provider-configs',
      params: {
        page: this.providerPage,
        pageSize: this.providerPageSize
      }
    });

    this.generateQrService.listSftpProviderConfigs(this.providerPage, this.providerPageSize).pipe(
      finalize(() => {
        this.isLoadingProviders = false;
      })
    ).subscribe({
      next: (response) => {
        console.log('[SFTP PROVIDER RESPONSE][LIST]', response);
        this.providerTotal = response?.total ?? 0;
        const items = Array.isArray(response?.items) ? response.items : [];
        this.providerRows = items.map((item: any) => ({
          ...item,
          serviceMappingsCount: item?.serviceMappingsCount ?? (Array.isArray(item?.serviceMappings) ? item.serviceMappings.length : 0),
          serviceMappingsSummary: this.buildMappingsSummary(item?.serviceMappings),
          password_masked: item?.password ? '********' : '-',
          active_text: Number(item?.active) === 1 ? 'activo' : 'inactivo',
          styleClass: Number(item?.active) === 1 ? 'activo' : 'inactivo'
        }));
      },
      error: (error) => {
        console.error('[SFTP PROVIDER ERROR][LIST]', error);
        this.mytoastr.showError('No se pudieron listar los providers', '');
      }
    });
  }

  onProviderPageChange(event: PageEvent): void {
    this.providerPageSize = event.pageSize;
    this.providerPage = event.pageIndex + 1;
    this.loadProviders();
  }

  onProviderAction(event: any): void {
    const action = event?.value || event?.action;
    const row = event?.element || event?.row || event?.data;

    if (action === 'view' && row) {
      this.openProviderDetail(row);
      return;
    }

    if (action === 'edit' && row) {
      this.openProviderDialog(row);
    }
  }

  openProviderDetail(row: any): void {
    const providerId = row?.id ?? null;
    if (!providerId) {
      return;
    }

    this.loadProviderDetail(providerId, true);
  }

  addServiceMapping(): void {
    if (!this.selectedProviderDetail?.id || !this.selectedServiceNameToMap || this.isSavingMapping) {
      return;
    }

    this.persistServiceMapping(this.selectedServiceNameToMap, Number(this.selectedProviderDetail.id), 1, 'Servicio relacionado');
  }

  saveServiceMapping(mapping: any): void {
    if (!mapping?.serviceName || !this.selectedProviderDetail?.id || this.isSavingMapping) {
      return;
    }

    const active = Number(mapping?.relationActive ?? (mapping?.mappingActive ? 1 : 0));
    this.persistServiceMapping(mapping.serviceName, Number(this.selectedProviderDetail.id), active, 'Relacion actualizada');
  }

  removeServiceMapping(mapping: any): void {
    if (!mapping?.serviceId || this.isSavingMapping) {
      return;
    }

    this.isSavingMapping = true;
    this.spinner.spinnerOnOff();
    this.generateQrService.deleteServiceSftpProvider(mapping.serviceId)
      .pipe(finalize(() => {
        this.isSavingMapping = false;
        this.spinner.spinnerOnOff();
      }))
      .subscribe({
        next: (response) => {
          console.log('[SFTP PROVIDER RESPONSE][UNLINK]', response);
          this.mytoastr.showSuccess('Servicio desvinculado', mapping?.serviceName || mapping?.serviceId);
          this.reloadProviderDetailAndTable();
        },
        error: (error) => {
          console.error('[SFTP PROVIDER ERROR][UNLINK]', error);
          this.mytoastr.showError('No se pudo desvincular el servicio', '');
        }
      });
  }


  getAvailableQrServicesForProvider(): any[] {
    const mappedNames = new Set(
      (this.selectedProviderDetail?.serviceMappings || []).map((mapping: any) => this.normalizeText(mapping?.serviceName || ''))
    );

    return this.qrConfiguredServices.filter((service: any) => {
      const serviceName = this.normalizeText(this.getQrConfiguredServiceName(service));
      return !!serviceName && !mappedNames.has(serviceName);
    });
  }

  private persistServiceMapping(serviceName: string, providerId: number, active: number, successMessage: string): void {
    this.isSavingMapping = true;
    this.spinner.spinnerOnOff();

    this.generateQrService.upsertServiceSftpProvider(serviceName, providerId, active)
      .pipe(finalize(() => {
        this.isSavingMapping = false;
        this.spinner.spinnerOnOff();
      }))
      .subscribe({
        next: (response) => {
          console.log('[SFTP PROVIDER RESPONSE][UPSERT RELATION]', response);
          this.mytoastr.showSuccess(successMessage, serviceName);
          this.selectedServiceNameToMap = '';
          this.reloadProviderDetailAndTable();
        },
        error: (error) => {
          console.error('[SFTP PROVIDER ERROR][UPSERT RELATION]', error);
          this.mytoastr.showError('No se pudo guardar la relacion del servicio', '');
        }
      });
  }

  private reloadProviderDetailAndTable(): void {
    const providerId = this.selectedProviderDetail?.id;
    this.loadProviders();
    if (providerId) {
      this.loadProviderDetail(providerId, false);
    }
  }

  private loadProviderDetail(providerId: number | string, openDialog: boolean): void {
    this.spinner.spinnerOnOff();
    this.generateQrService.getSftpProviderConfig(providerId).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (response) => {
        console.log('[SFTP PROVIDER RESPONSE][DETAIL VIEW]', response);
        const item = response?.item || response?.data || response;
        this.selectedProviderDetail = {
          ...item,
          active_text: Number(item?.active) === 1 ? 'activo' : 'inactivo',
          styleClass: Number(item?.active) === 1 ? 'activo' : 'inactivo',
          serviceMappingsCount: item?.serviceMappingsCount ?? (Array.isArray(item?.serviceMappings) ? item.serviceMappings.length : 0),
          serviceMappings: Array.isArray(item?.serviceMappings)
            ? item.serviceMappings.map((mapping: any) => ({
              ...mapping,
              relationActive: mapping?.mappingActive ? 1 : 0
            }))
            : []
        };
        this.selectedServiceNameToMap = '';
        if (openDialog) {
          this.providerDetailDialogRef = this.dialog.open(this.providerDetailDialog, {
            width: '880px',
            maxWidth: '95vw',
            panelClass: 'provider-config-dialog'
          });
        }
      },
      error: (error) => {
        console.error('[SFTP PROVIDER ERROR][DETAIL VIEW]', error);
        this.mytoastr.showError('No se pudo cargar el detalle del provider', '');
      }
    });
  }



  openNotificationEmailDialog(row?: any): void {
    const notificationEmailId = Number(row?.id ?? 0);

    if (!notificationEmailId) {
      this.editingNotificationEmailId = null;
      this.notificationEmailForm.reset({
        email: '',
        serviceId: '',
        active: 1,
        description: ''
      });
      this.notificationEmailDialogRef = this.dialog.open(this.notificationEmailDialog, {
        width: '720px',
        maxWidth: '95vw',
        panelClass: 'provider-config-dialog'
      });
      return;
    }

    this.spinner.spinnerOnOff();
    this.generateQrService.getNotificationEmail(notificationEmailId).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: (response) => {
        const item = response?.item || response?.data || response;
        this.editingNotificationEmailId = Number(item?.id ?? notificationEmailId);
        this.notificationEmailForm.reset({
          email: item?.email || '',
          serviceId: item?.serviceId || item?.service_id || '',
          active: Number(item?.active ?? 1),
          description: item?.description || ''
        });
        this.notificationEmailDialogRef = this.dialog.open(this.notificationEmailDialog, {
          width: '720px',
          maxWidth: '95vw',
          panelClass: 'provider-config-dialog'
        });
      },
      error: (error) => {
        console.error('[NOTIFICATION EMAIL ERROR][DETAIL]', error);
        this.mytoastr.showError('No se pudo cargar el correo', '');
      }
    });
  }

  saveNotificationEmail(): void {
    if (this.notificationEmailForm.invalid || this.isSavingNotificationEmail) {
      this.notificationEmailForm.markAllAsTouched();
      return;
    }

    const rawValue = this.notificationEmailForm.getRawValue();
    const payload = {
      email: rawValue.email,
      serviceId: rawValue.serviceId || null,
      active: Number(rawValue.active ?? 1),
      description: rawValue.description || ''
    };

    this.isSavingNotificationEmail = true;
    this.spinner.spinnerOnOff();

    const request$ = this.editingNotificationEmailId
      ? this.generateQrService.updateNotificationEmail(this.editingNotificationEmailId, payload)
      : this.generateQrService.createNotificationEmail(payload);

    request$.pipe(
      finalize(() => {
        this.isSavingNotificationEmail = false;
        this.spinner.spinnerOnOff();
      })
    ).subscribe({
      next: () => {
        this.mytoastr.showSuccess(
          this.editingNotificationEmailId ? 'Correo actualizado' : 'Correo registrado',
          payload.email
        );
        this.notificationEmailDialogRef?.close();
        this.editingNotificationEmailId = null;
        this.loadNotificationEmails();
      },
      error: (error) => {
        console.error('[NOTIFICATION EMAIL ERROR][SAVE]', error);
        this.mytoastr.showError('No se pudo guardar el correo', '');
      }
    });
  }

  loadNotificationEmails(): void {
    if (this.isLoadingNotificationEmails) {
      return;
    }

    const filtersValue = this.notificationEmailFiltersForm.getRawValue();
    const filters: Record<string, any> = {
      email: filtersValue.email || undefined,
      active: filtersValue.active !== '' ? Number(filtersValue.active) : undefined,
      serviceId: filtersValue.serviceId || undefined
    };

    if (filters['serviceId']) {
      filters['includeGlobal'] = Number(filtersValue.includeGlobal ?? 1);
    }

    this.isLoadingNotificationEmails = true;
    this.generateQrService.listNotificationEmails(this.notificationEmailPage, this.notificationEmailPageSize, filters).pipe(
      finalize(() => {
        this.isLoadingNotificationEmails = false;
      })
    ).subscribe({
      next: (response) => {
        this.notificationEmailTotal = response?.total ?? 0;
        const items = Array.isArray(response?.items) ? response.items : [];
        this.notificationEmailRows = items.map((item: any) => {
          const isActive = item?.active === true || Number(item?.active) === 1;
          const serviceId = item?.serviceId || item?.service_id || null;
          const scope = String(item?.scope || '').trim().toLowerCase();
          return {
            ...item,
            serviceId,
            created_at: item?.created_at || item?.createdAt || null,
            updated_at: item?.updated_at || item?.updatedAt || null,
            serviceNameDisplay: this.resolveNotificationServiceName(item),
            scopeText: scope || (serviceId ? 'servicio' : 'global'),
            activeText: isActive ? 'activo' : 'inactivo',
            styleClass: isActive ? 'activo' : 'inactivo'
          };
        });
      },
      error: (error) => {
        console.error('[NOTIFICATION EMAIL ERROR][LIST]', error);
        this.mytoastr.showError('No se pudieron listar los correos', '');
      }
    });
  }

  searchNotificationEmails(): void {
    this.notificationEmailPage = 1;
    this.loadNotificationEmails();
  }

  clearNotificationEmailFilters(): void {
    this.notificationEmailFiltersForm.reset({
      email: '',
      serviceId: '',
      includeGlobal: 1,
      active: ''
    });
    this.notificationEmailPage = 1;
    this.loadNotificationEmails();
  }

  onNotificationEmailPageChange(event: PageEvent): void {
    this.notificationEmailPageSize = event.pageSize;
    this.notificationEmailPage = event.pageIndex + 1;
    this.loadNotificationEmails();
  }

  onNotificationEmailAction(event: any): void {
    const action = event?.value || event?.action;
    const row = event?.element || event?.row || event?.data;

    if (!row) {
      return;
    }

    if (action === 'edit') {
      this.openNotificationEmailDialog(row);
      return;
    }

    if (action === 'delete') {
      this.deleteNotificationEmail(row);
    }
  }

  deleteNotificationEmail(row: any): void {
    const notificationEmailId = Number(row?.id ?? 0);
    if (!notificationEmailId) {
      return;
    }

    if (!confirm(`?Eliminar el correo ${row?.email || ''}?`)) {
      return;
    }

    this.spinner.spinnerOnOff();
    this.generateQrService.deleteNotificationEmail(notificationEmailId).pipe(
      finalize(() => this.spinner.spinnerOnOff())
    ).subscribe({
      next: () => {
        this.mytoastr.showSuccess('Correo eliminado', row?.email || '');
        this.loadNotificationEmails();
      },
      error: (error) => {
        console.error('[NOTIFICATION EMAIL ERROR][DELETE]', error);
        this.mytoastr.showError('No se pudo eliminar el correo', '');
      }
    });
  }

  getNotificationEmailServiceOptions(): any[] {
    return this.qrConfiguredServices || [];
  }

  private resolveNotificationServiceName(item: any): string {
    const directName = item?.serviceName || item?.service_name;
    if (directName) {
      return directName;
    }

    const serviceId = item?.serviceId || item?.service_id;
    if (!serviceId) {
      return 'Global';
    }

    const match = (this.qrConfiguredServices || []).find((service: any) => this.getQrConfiguredServiceId(service) === serviceId);
    return this.getQrConfiguredServiceName(match) || serviceId;
  }

  private buildMappingsSummary(serviceMappings: any): string {
    if (!Array.isArray(serviceMappings) || !serviceMappings.length) {
      return '-';
    }

    return serviceMappings
      .map((mapping: any) => `${mapping?.serviceName || '-'} (${mapping?.serviceId || '-'})`)
      .join(' | ');
  }

  private extractItems(payload: any): any[] {
    const items = payload?.data?.Items
      ?? payload?.data?.items
      ?? payload?.Items
      ?? payload?.items
      ?? [];

    return Array.isArray(items) ? items : [];
  }

  getLigopayServiceLabel(service: any): string {
    return this.getLigopayServiceName(service) || '-';
  }

  getLigopayServiceIdentifier(service: any): string {
    return service?.id || service?.id_serviceProv || '-';
  }

  getQrConfiguredServiceLabel(service: any): string {
    return this.getQrConfiguredServiceName(service) || '-';
  }

  getQrConfiguredServiceIdentifier(service: any): string {
    return this.getQrConfiguredServiceId(service) || '-';
  }

  getQrConfiguredBusinessCode(service: any): string {
    return service?.businessCode || service?.business_code || '-';
  }

  trackByLigopayService = (_: number, item: any): string => {
    return String(item?.id || item?.id_serviceProv || item?.name || item?.description || item?.business || '');
  };

  trackByQrConfiguredService = (_: number, item: any): string => {
    return String(item?.service_id || item?.serviceId || item?.id || item?.service_name || item?.serviceName || item?.name || '');
  };

  trackByProviderMapping(_: number, mapping: any): string {
    return String(mapping?.serviceId || mapping?.serviceName);
  }

  private getLigopayServiceName(service: any): string {
    return service?.name || service?.description || service?.business || '';
  }

  private getQrConfiguredServiceId(service: any): string {
    return service?.service_id || service?.serviceId || service?.id || '';
  }

  private getQrConfiguredServiceName(service: any): string {
    return service?.service_name || service?.serviceName || service?.name || '';
  }

  private normalizeText(value: string): string {
    return (value || '').trim().toUpperCase();
  }

  private isSameService(a: any, b: any): boolean {
    const idA = a?.id || a?.id_serviceProv || this.getLigopayServiceName(a);
    const idB = b?.id || b?.id_serviceProv || this.getLigopayServiceName(b);
    return idA === idB;
  }
}


