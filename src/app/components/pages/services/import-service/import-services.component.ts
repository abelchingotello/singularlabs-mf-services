import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { MatDialog } from '@angular/material/dialog';
import { DialogTemplateCreateServicesComponent } from 'src/app/dialogs/dialog-template-create-services/dialog-template-create-services.component';


@Component({
  selector: 'uni-update-services',
  templateUrl: './import-services.component.html',
  styleUrls: ['./import-services.component.scss']
})
export class ImportServicesComponent implements OnInit {

  public serviceName: any;
  public typeComission: any;
  public persons: any;
  public disableProvider = false;
  public cancel: boolean = false;
  public valueImport: any;

  // propiedades para la carga de un archivo excel
  public showExcelUpload: boolean = false;
  public selectedFile: File | null = null;
  public excelData: any[] = [];
  public finalData: any;
  public disableFile: boolean = false;
  public isProcessingExcel: boolean = false;
  public showSendServices: boolean = false;
  public requiredIdClient: string = '';
  public disableCargar: boolean = false;
  //------------------

  constructor(
    private personService: PersonService,
    private router: Router,
    private route: ActivatedRoute,
    private serviceServ: ServicesService,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private dialog: MatDialog,
    
  ) { }

  ngOnInit(): void {
    const valueImport = this.route.snapshot.paramMap.get('value');
    this.valueImport = valueImport;
    this.listData();
  }

  listData() {
    this.spinner.spinnerOnOff();
    //obtener los datos de las personas de PROVEEDOR
    forkJoin([
      this.personService.getPerson('PROVEEDOR',undefined,true)
    ]).subscribe({
      next: (response) => {
        const [person] = response;
        console.log("Datos de personas obtenidos:", person.data);
        this.persons = person.data;
        this.spinner.spinnerOnOff();
      },
      error: (error: any) => {
        console.error('Error al obtener las personas:', error);
        this.mytoastr.showError('Error', 'No se pudo cargar la lista de personas');
        this.spinner.spinnerOnOff();
      }
    });
  }
  onCancel() {
    this.router.navigate(['../../service']);
  }
  selectClient(event) {
    console.log("evento ttiy: ", event.value)
    this.requiredIdClient = event.value;
  }

  confirmIdClient() {
    if (!this.requiredIdClient?.trim()) {
      this.mytoastr.showWarning('Error', 'Debe ingresar un ID Cliente válido');
      return;
    }
    this.showExcelUpload = true;
    this.disableProvider = true;
    this.disableCargar = true;

  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.mytoastr.showWarning('Error', 'Por favor seleccione un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      this.selectedFile = file;
    }
  }

  //Metodo para generar los ADDITIONAL_PAYMENT
  generateAdditionalPayment(value: any): any[] {
    const data: any[] = [];

    for (let i = 1; i <= 3; i++) {
      const refKey = `REFERENCIA ${i}`;
      const typeKey = `TIPO DE CAMPO DE REFERENCIA ${i}`;
      const lengthKey = `LONGITUD DE CAMPO REFERENCIA ${i}`;
      if (value[refKey] !== 0) {
        if (value[refKey]?.trim()) {
          const fieldType = value[typeKey]?.trim() === 'N' ? 'NUMERICO' : 'ALFANUMERICO';

          const isFirstRef = i === 1;
          const modalidad = value['MODALIDAD DE RECAUDO'];
          const isMandatory = (modalidad === 'DATA ENTRY') ||
            (modalidad === 'BASE DE DATOS' && isFirstRef) ||
            (modalidad === 'INTERCONECTADA' && isFirstRef);

          data.push({
            id: `00${i}`,
            name: value[refKey].trim(),
            fieldType: {
              id: value[typeKey].trim(),
              name: fieldType
            },
            fieldMask: 'D',
            maximumLength: value[lengthKey],
            isMandatory,
            isEditable: isMandatory
          });
        }
      }
    }

    if (value['MODALIDAD DE RECAUDO'] === 'DATA ENTRY') {
      data.push({
        id: 'IMPOR',
        name: 'IMPORTE DE LA DEUDA',
        fieldType: {
          id: 'N',
          name: 'NUMERICO'
        },
        fieldMask: '0000000000000000000000I',
        maximumLength: 22,
        isMandatory: true,
        isEditable: true
      });
    }

    return data;
  }

  //Metodo para generar los indicadores
  generateIndicators(value: any): any[] {
    const modalidad = value['MODALIDAD DE RECAUDO'];
    const bd = modalidad === 'BASE DE DATOS' || modalidad === 'INTERCONECTADA';
    const inter = modalidad === 'INTERCONECTADA';
    const pago = value['PAGO PARCIAL'] !== 'NO';
    const deuda = value['DEUDA MÁS ANTIGUA PRIMERO T'] !== 'NO';

    return [
      { id: 'PAY_BILL', name: 'BASE DE DATOS', isActive: bd },
      { id: 'PAY_PARTIAL', name: 'PAGO PARCIAL', isActive: pago },
      { id: 'PAY_CARD', name: 'PAGO CON TARJETA', isActive: true },
      { id: 'FREQUENT_OPERATION', name: 'OPERACION FRECUENTE', isActive: true },
      { id: 'PAY_DEBT_OLDEST', name: 'DEUDA MAS ANTIGUA', isActive: deuda },
      { id: 'PAY_ONLINE', name: 'INTERCONECTADO, PAGO EN LINEA', isActive: inter },
      { id: 'PAY_ACCOUNT', name: 'PAGO CON CARGO EN CUENTA', isActive: true },
      { id: 'PAY_REFLECTED', name: 'REFLEJO DE PAGO', isActive: false },
      { id: 'PAY_AUTOMATIC', name: 'DEBITO AUTOMATICO', isActive: false },
      { id: 'PAY_FIXED_RATE', name: 'TASAS FIJAS', isActive: false },
      { id: 'PAY_CASH', name: 'PAGO EN EFECTIVO', isActive: true },
      { id: 'PAY_CHECK_INTERNAL', name: 'PAGO CON CHEQUE PROPIO BANCO', isActive: false },
      { id: 'PAY_CHECK_EXTERNAL', name: 'PAGO CON CHEQUE OTRO BANCO', isActive: false },
      { id: 'PAY_MULTIPLE_PAYMENTS', name: 'ACTUALIZACION MASIVA DE DEUDAS', isActive: false }
    ];
  }

  // Método para transformar los datos del Excel a la estructura requerida
  transformExcelData(jsonData: any[]): any[] {
    const REQUIRED_COLUMNS = ["ITEM", "ID SERVICIO", "ID CATEGORIA", "CATEGORIA AGENTE CASH", "DESCRIPCIÓN DEL CONVENIO",
      "ESTADO DEL CONVENIO T", "MODALIDAD DE RECAUDO", "PAGO PARCIAL", "DEUDA MÁS ANTIGUA PRIMERO T", "REFERENCIA 1",
      "TIPO DE CAMPO DE REFERENCIA 1", "LONGITUD DE CAMPO REFERENCIA 1", "REFERENCIA 2", "TIPO DE CAMPO DE REFERENCIA 2",
      "LONGITUD DE CAMPO REFERENCIA 2", "REFERENCIA 3", "TIPO DE CAMPO DE REFERENCIA 3", "LONGITUD DE CAMPO REFERENCIA 3",
    ];

    // Validar que haya datos
    if (!jsonData || jsonData.length === 0) {
      this.mytoastr.showWarning('Error', 'El archivo Excel está vacío.');
      return [];
    }

    // Validar que todas las columnas requeridas estén presentes 
    const headers = Object.keys(jsonData[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      this.mytoastr.showWarning('Error', `Faltan las siguientes columnas requeridas: ${missingColumns.join(", ")}`);
      return [];
    }

    // Filtrar registros que estén Activos
    //const filteredData = jsonData.filter(value => value['ESTADO DEL CONVENIO T'] == 'Activo');
    const filteredData = jsonData;
    // Transformar los registros filtrados
    return filteredData.map(value => {
      const pk = uuidv4();
      const sk = `SERVICE#${pk}`;
      const status = value['ESTADO DEL CONVENIO T'] === 'Activo'
        ? 'HABILITADO'
        : 'BLOQUEADO';

      let comission;
      let comissionFixed = "";
      let comissionPct = "";

      if (value['TIPO COMISIÓN'] === 'COMISIÓN FIJA') {
        comission = 'FIJO';
        comissionFixed = value['COMISIÓN A PAGAR B2CASH SIN IGV'];
      } else if (value['TIPO COMISIÓN'] === 'COMISIÓN PORCENTUAL') {
        comission = 'PORCENTUAL';
        comissionPct = value['COMISIÓN A PAGAR B2CASH SIN IGV'];
      }

      // const comissionType = ['FIJO', 'PORCENTUAL', 'MULTIPLE'][commissions.type - 1];

      const serviceObject: any = {
        PK: pk,
        SK: sk,
        ADDITIONAL_PAYMENT_FIELDS: JSON.stringify(this.generateAdditionalPayment(value)),
        BUSINESS: value['DESCRIPCIÓN DEL CONVENIO'].trim(),
        DATE: new Date(),
        ID_CLIENT: '00000100',
        ID_PROVIDER: this.requiredIdClient,
        ID_SERVICE: 'SAC000',
        ID_SERVICE_PROV: value['ID SERVICIO'],
        ID_TYPE_SERVICE: value['ID CATEGORIA'].toString(),
        INDICATORS: JSON.stringify(this.generateIndicators(value)),
        PREFIX: 'SERVICE',
        SERVICE_CATEGORY: value['CATEGORIA AGENTE CASH'],
        SERVICE_NAME: value['DESCRIPCIÓN DEL CONVENIO'].trim(),
        STATUS: status,
        TYPE_COMISSION: comission,
        TYPE_SERVICE: value['CATEGORIA AGENTE CASH'],
        EXTORNO: false
      };


      if (comissionFixed !== null) serviceObject.COMISSION_FIXED = comissionFixed;
      if (comissionPct !== null) serviceObject.COMISSION_PCT = comissionPct;
      //if (commissions.criterion !== null) serviceObject.COMISSION_CRITERION = commissions.criterion;

      return serviceObject;
    });
  }

  // Método para procesar el archivo Excel
  async processExcelFile() {
    if (!this.selectedFile) {
      this.mytoastr.showWarning('Error', 'Por favor seleccione un archivo');
      return;
    }

    //this.isProcessingExcel = true;
    this.spinner.spinnerOnOff();

    try {
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const excelData = XLSX.utils.sheet_to_json(worksheet);

      // Procesar los datos usando la lógica del script original

      this.finalData = this.transformExcelData(excelData);

      if (this.finalData.length === 0) {
        this.mytoastr.showError('Error', 'No se encontraron datos válidos en el archivo');
        return;
      }
      console.log("Primer objeto de importacion construido", JSON.stringify(this.finalData[0], null, 2));
      this.disableFile = true;
      this.isProcessingExcel = true;
      this.showSendServices = true;
      this.mytoastr.showSuccess('Archivo validado correctamente', `Se encontraron ${this.finalData.length} registros`);

    } catch (error) {
      console.error('Error procesando archivo Excel:', error);
      this.mytoastr.showError('Error', 'Error al procesar el archivo Excel');
    } finally {
      this.spinner.spinnerOnOff();
    }
  }


  registerServiceRequest(data: any) {
    this.spinner.spinnerOnOff();
    // Convertir el objeto `data` a string y luego a base64
    const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(data))));


    this.serviceServ.registerServiceImport({ payload: base64Data }, this.valueImport).subscribe({
      next: (response) => {
        console.log("RESPUESTA DE IMPORTACION: ", response)
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning(response.messages || 'Error : Algunos servicios yno se procesaron correctamente', '')
          this.excelData = response.data?.itemsFailed?.map(x => x.item) || [];
          return
        }
        if (response.statusCode == 400) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('No se registro ningun item', '')
          return
        }
        if (response.statusCode == 200) {
          this.mytoastr.showSuccess('Servicios importados con éxito', '')
          this.router.navigate(['../service'])
        }
        if (response.statusCode == 500) {
          this.mytoastr.showError('Importación no se proceso correctamente', '')
          this.router.navigate(['../service'])
          return
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        //this.clearRegister()
        this.spinner.spinnerOnOff();

      }
    })
  }

  //Metodo para enviar los servicios al backend
  sendServices() {
    try {
      if (!this.finalData || this.finalData.length === 0) {
        this.mytoastr.showWarning('Error', 'No hay datos para enviar');
        return;
      }

      this.registerServiceRequest(this.finalData);

    } catch (error) {
      console.error('Error al enviar los servicios:', error);
      this.mytoastr.showError('Error', 'No se pudieron enviar los servicios');
    }
  }

  cancelSend() {
    this.showSendServices = false;
    this.showExcelUpload = false;
    this.disableCargar = false;
    this.disableProvider = false;
    this.isProcessingExcel = false;
    this.disableFile = false;
    this.selectedFile = null;
  }

  // Método para cancelar la carga de Excel
  cancelExcelUpload() {
    this.showExcelUpload = false;
    this.disableCargar = false;
    this.disableProvider = false;
    this.showSendServices = false;
    this.isProcessingExcel = false;
    this.disableFile = false;
    this.selectedFile = null;
  }

  // Método para limpiar los datos de Excel
  cancelData() {
    this.showSendServices = false;
    this.showExcelUpload = false;
    this.disableCargar = false;
    this.disableProvider = false;
    this.isProcessingExcel = false;
    this.disableFile = false;
    this.selectedFile = null;
    this.excelData = [];
  }

  cancelar() {
    this.cancel = false;
    this.showExcelUpload = false;
  }

  downloadTemplate() {
    const dialogRef = this.dialog.open(DialogTemplateCreateServicesComponent
      , {
        width: '900px',
        maxHeight: '80vh'
      });

    dialogRef.afterClosed().subscribe(result => {

    });
  }
}
