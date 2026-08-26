import { Component, OnInit, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MasterService } from 'src/app/services/master.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';


@Component({
  selector: 'uni-dialog-template-create-services',
  templateUrl: './dialog-template-create-services.component.html',
  styleUrls: ['./dialog-template-create-services.component.scss']
  })
  export class DialogTemplateCreateServicesComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogTemplateCreateServicesComponent>,
    private readonly service: ServicesService,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
    private readonly masterService: MasterService,
  ) { }

  public typeService: any[] = [];
  
  public dataFilter: any = [];
  public dataCategorie: any[];
  public dataTemplateColumns: any[] = [
  {
    "columna": "ITEM",
    "descripcion": "Número de fila a evaluar",
    "requerido": true
  },
  {
    "columna": "ID CATEGORIA",
    "descripcion": "Identificador de la categoría de AgenteCash",
    "requerido": true
  },
  {
    "columna": "CATEGORIA AGENTE CASH",
    "descripcion": "Nombre de la categoría de AgenteCash",
    "requerido": true
  },
  {
    "columna": "ID SERVICIO",
    "descripcion": "Código del servicio asignado por el proveedor",
    "requerido": true
  },
  {
    "columna": "TIPO COMISIÓN",
    "descripcion": "Tipo de comisión aplicada (ver sección inferior)",
    "requerido": true
  },
  {
    "columna": "COMISIÓN A PAGAR B2CASH SIN IGV",
    "descripcion": "Valor numérico de la comisión principal",
    "requerido": true
  },
  {
    "columna": "DESCRIPCIÓN DEL CONVENIO",
    "descripcion": "Nombre descriptivo del servicio",
    "requerido": true
  },
  {
    "columna": "MODALIDAD DE RECAUDO",
    "descripcion": "Forma de recaudación (BASE DE DATOS, INTERCONECTADA, DATA ENTRY)",
    "requerido": true
  },
  {
    "columna": "PAGO PARCIAL",
    "descripcion": "Indentificador del servicio sobre pago",
    "requerido": true
  },
  {
    "columna": "DEUDA MÁS ANTIGUA PRIMERO T",
    "descripcion": "Indentificador del servicio sobre pago",
    "requerido": true
  },
  {
    "columna": "REFERENCIA 1",
    "descripcion": "Primer campo de REFERENCIA del cliente",
    "requerido": true
  },
  {
    "columna": "LONGITUD DE CAMPO REFERENCIA 1",
    "descripcion": "Cantidad de caracteres del campo de REFERENCIA 1",
    "requerido": true
  },
  {
    "columna": "TIPO DE CAMPO DE REFERENCIA 1",
    "descripcion": "Tipo de dato del campo de REFERENCIA 1 (A: Alfanumérico, N: Numérico)",
    "requerido": true
  },
  {
    "columna": "REFERENCIA 2",
    "descripcion": "Segundo campo de REFERENCIA del cliente",
    "requerido": false
  },
  {
    "columna": "LONGITUD DE CAMPO REFERENCIA 2",
    "descripcion": "Cantidad de caracteres del campo de REFERENCIA 2",
    "requerido": false
  },
  {
    "columna": "TIPO DE CAMPO DE REFERENCIA 2",
    "descripcion": "Tipo de dato del campo de REFERENCIA (A: Alfanumérico, N: Numérico)",
    "requerido": false
  },
  {
    "columna": "REFERENCIA 3",
    "descripcion": "Tercer campo de REFERENCIA del cliente",
    "requerido": false
  },
  {
    "columna": "LONGITUD DE CAMPO REFERENCIA 3",
    "descripcion": "Cantidad de caracteres del campo de REFERENCIA 3",
    "requerido": false
  },
  {
    "columna": "TIPO DE CAMPO DE REFERENCIA 3",
    "descripcion": "Tipo de dato del campo de REFERENCIA 3 (A: Alfanumérico, N: Numérico)",
    "requerido": false
  },
  {
    "columna": "ESTADO DEL CONVENIO T",
    "descripcion": "Estado del servicio (Suspendido, Activo)",
    "requerido": true
  }
]
;

  
  public columns2: any[] = [
    { 'name': 'Columna', 'attribute': 'columna' },
    { 'name': 'Descripción', 'attribute': 'descripcion' },
    {
      'name': 'Requerido', 'attribute': 'requerido', 'config': {
        'styleClass': true
      }
    },
  ];
  public columns: any[] = [
    { 'name': 'ID', 'attribute': 'master_idTypeService' },
    { 'name': 'Categoría', 'attribute': 'master_name' },
    {
      'name': 'Estado', 'attribute': 'master_status', 'config': {
        'styleClass': true
      }
    },
  ];
  

  public pageSize: any = 50;
  public pageKey: any[];
  public pageSize2: any = 20;
  public pageKey2: any[]
  public page: number = -1; // Variable para la página actual
  public count: number = null; // Variable para el total de elementos
  public count2: number = null; // Variable para el total de elementos
  public valuetrue: boolean = true;

  async ngOnInit(): Promise<void> {
    console.log("respuesta de servicio")
 this.dataTemplateColumns = this.dataTemplateColumns.map(item => ({
  ...item,
  requerido: item.requerido ? '✅' : '❌'
}));
   // Esperar que cargue modalidades y luego seleccionar la correcta
   this.count2 = this.dataTemplateColumns.length
   await this.listData();
 }
onPageChange(event: PageEvent, tabla: string) {
  if (tabla === 'tabla1') {
    console.log('Cambió la paginación de la tabla estática', event);
  } else {
    console.log('Cambió la paginación de la tabla dinámica', event);
  }
}

  clearData() {
    this.count = null;
    this.pageKey = undefined;
    this.dataCategorie = [];
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
  }
  
  async reload() {
    this.clearData();
    await this.listData();
  }

   private async listData(): Promise<void> {
 
     const [typeService] = await firstValueFrom(
       forkJoin([
         this.masterService.getItemsMasterTable('14')
       ])
     );
 
     this.typeService = typeService.sort(
       (a, b) => a.master_order - b.master_order
     );
     this.dataCategorie = this.typeService
 
     console.log('typeService', this.typeService);
      this.pageKey = null;
        
      this.count = this.typeService.length;
    }
  download() {
    this.spinner.spinnerOnOff();



    const inbx = 'template_create_services';
    const token = localStorage.getItem('fcmToken');
    this.service.exportServices("xlsx", { status: "HABILITADO" }, inbx, token).subscribe({
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
        console.error('Error durante la exportación:', error);
        this.mytoastr.showError('Error durante la exportación', '');
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
