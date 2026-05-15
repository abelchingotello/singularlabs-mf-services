import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { forkJoin, lastValueFrom } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationUtils } from 'src/app/utilities/PaginationUtils';

@Component({
  selector: 'uni-dialog-service-assign-provider-status',
  templateUrl: './dialog-service-assign-provider-status.component.html',
  styleUrls: ['./dialog-service-assign-provider-status.component.scss']
})
export class DialogServiceAssignProviderStatusComponent implements OnInit {
  public pageSize: any = 5;
  public pageKey: any[];
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos

  public functionDataCurrent: (pageSize: any) => any;

  public disabledButton: boolean = true;
  public formEntity!: FormGroup;
  public listProviders: any[] = [];
  public masterStatus: any[] = [];
  public clientData: any;
  public dataService: any;
  public dataFilter: any;

  public columns: any[] = [
    { 'name': 'Id del servicio', 'attribute': 'id' },
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName' },
  ];
  private readonly pagUtils: PaginationUtils | undefined;

  constructor(
    private readonly form: FormBuilder,
    public dialogRef: MatDialogRef<DialogServiceAssignProviderStatusComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private readonly service: ServicesService,
    private readonly personService: PersonService,
    private readonly spinner: SpinnerService,

    private readonly masterService: MasterService,
    private readonly mytoastr: MytoastrService
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.initializaForms();
    this.functionDataCurrent = this.dataInitial.bind(this); //replica la funcion
    this.listData();
  }

  searchData() {
    this.clearData();
    this.dataInitial(this.pageSize);
  }



  dataInitial(pageSize: any) {
    const provider = this.provider.value?.toUpperCase();
    this.provider.disable();
    this.service.getServices(null, null, null, null, this.count, null, pageSize, this.pageKey, undefined, null, provider, null).subscribe({
      next: (data) => {
        this.provider.enable();
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        this.dataFilter = [...this.dataFilter, ...data.data.Items]; // Acumula los datos en dataFilter

        this.dataService = this.dataFilter.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || '',
        }));
        console.log("data.data.nextPageKey:");
        console.log(data.data.nextPageKey);
        console.log("this.count:");
        console.log(this.count);
        console.log("data.data.Count:");
        console.log(data.data.Count);
        if (this.dataService.length == this.count) {//se recuperaron todos los datos
          this.pageKey = null;
        } else {
          this.pageKey = data.data.nextPageKey ?? null;
        }
        this.count = data.data.Count ?? 0;
      },
      error: (err) => {
        console.log(err);
      },

    })
  }

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataService = [];
    this.dataFilter = [];
  }

  async listData() {
    const [
      masterStatus,
      provAndEntity
    ] = await lastValueFrom(
      forkJoin([
        this.masterService.getItemsMasterTable('1'),
        this.personService.getPersonsPandR(),
      ])
    );

    this.listProviders = provAndEntity.data.providerTransform;
    this.masterStatus = masterStatus.sort((a: any, b: any) => a.master_order - b.master_order);

    this.clientData = provAndEntity.data.recaudadorTransform.find((item: any) => item.servicePerson?.idPerson == this.data.id)?.servicePerson;
    this.formEntity.get('client')?.setValue(this.clientData?.nameAlias || "");
  }

  initializaForms() {
    this.formEntity = this.form.group({
      client: { value: "", disabled: true },
      provider: [''],
      status: ['']
    })
  }

  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  updateServicesFromProvider() {
    const body = {
      idProvider: this.provider.value,
      newStatus: this.status.value,
      idClient: this.data.id
    };

    this.service.updateAssingServicerFromProvider(body).subscribe({
      next: (data) => {
        if (data.statusCode == 201) {
          this.mytoastr.showWarning(data.messages, '')
          return
        }
        this.mytoastr.showSuccess('Éxito', 'Servicios actualizados correctamente.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.log(err);
        this.mytoastr.showError('Error', 'No se pudo actualizar los servicios.');
      }
    }).add(() => {
      this.spinner.spinnerOnOff();
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  get provider() {
    return this.formEntity.get('provider');
  }
  get status() {
    return this.formEntity.get('status');
  }
}

export interface DialogData {
  id: string;
}