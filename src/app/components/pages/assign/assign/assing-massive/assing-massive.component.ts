import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { forkJoin } from 'rxjs';
import { DialogTemplateAssignServiceComponent } from 'src/app/dialogs/dialog-template-assign-services/dialog-template-assign-services.component';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'uni-assing-massive',
  templateUrl: './assing-massive.component.html',
  styleUrls: ['./assing-massive.component.scss']
})
export class AssingMassiveComponent implements OnInit {

  public data: any;
  public disableEntities = false;

  public persons: any[] = [];
  public isDragOver: boolean = false;

  // propiedades para la carga de un archivo excel
  public showExcelUpload: boolean = false;
  public selectedFile: File | null = null;
  public excelData: any[] = [];
  public isProcessingExcel: boolean = false;
  public requiredIdClient: string = '';
  public disableFile: boolean = false;
  //------------------

  constructor(
    private serviceServ: ServicesService,
    private personService: PersonService,
    private router: Router,
    private spinner: SpinnerService,
    private mytoastr: MytoastrService,
    private cookies: CookieService,
    private dialog: MatDialog,

  ) { }

  /****************************************** METODOS INICIALES **********************************************/

  ngOnInit(): void {
    this.listData();
  }



  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.personService.getPerson('RECAUDADORA DE SERVICIOS', undefined, true)
    ]).subscribe({
      next: (response) => {
        const [person] = response;
        this.persons = person.data;
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


  /******************************************** METODOS PARA LOS BOTONES ******************************************/
  // Método para confirmar el ID Cliente e iniciar la carga
  confirmIdClient() {
    if (!this.requiredIdClient.trim()) {
      this.mytoastr.showWarning('Error', 'Debe ingresar un ID Cliente válido');
      return;
    }
    this.disableEntities = true; // Deshabilitar la selección de entidades
    this.showExcelUpload = true;
  }

  // Método para procesar el archivo Excel
  async processExcelFile() {
    if (!this.selectedFile) {
      this.mytoastr.showWarning('Error', 'Por favor seleccione un archivo');
      return;
    }

    this.isProcessingExcel = true;
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
      const processedData = this.convertExcelToAssignmentFormat(excelData);
      if (processedData.length === 0) {
        this.mytoastr.showError('Error', 'No se encontraron datos válidos en el archivo');
        return;
      }

      // Asignar los datos procesados para mostrar en la tabla
      this.excelData = processedData;
      this.data = this.convertDataForTable(processedData);

      this.mytoastr.showSuccess('Archivo procesado correctamente', `Se cargaron ${processedData.length} registros`);

    } catch (error) {
      console.error('Error procesando archivo Excel:', error);
      this.mytoastr.showError('Error', 'Error al procesar el archivo Excel');
    } finally {
      this.isProcessingExcel = true;
      this.disableFile = true;
      this.spinner.spinnerOnOff();
    }
  }

  // Método para cancelar la carga de Excel
  cancelExcelUpload() {
    this.showExcelUpload = false;
    this.isProcessingExcel = false;
    this.disableFile = false;
    this.disableEntities = false;
    this.selectedFile = null;
    this.excelData = [];
    this.data = [];
  }

  // Método para limpiar los datos de Excel
  clearExcelData() {
    this.excelData = [];
    this.data = [];
    this.selectedFile = null;
    this.isProcessingExcel = false;
    this.disableFile = false;
  }

  // Método para confirmar y enviar las asignaciones desde Excel
  confirmExcelAssignments() {
    if (this.excelData.length === 0) {
      this.mytoastr.showWarning('Error', 'No hay datos para procesar');
      return;
    }

    // Usar el método existente para registrar las asignaciones
    this.registerServiceRequest(this.excelData);
  }

  registerServiceRequest(data: any) {

    this.spinner.spinnerOnOff();
    this.serviceServ.registerServiceAssign(data).subscribe({
      next: (response) => {
        if (response.statusCode == 207) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('Error : Algunos servicios ya fueron asignados', '')
          return
        }
        if (response.statusCode == 400) {
          // this.spinner.spinnerOnOff();
          this.mytoastr.showWarning('No se registro ningun item', '')
          return
        }
        if (response.statusCode == 200) {
          this.mytoastr.showSuccess('Servicio asignado con éxito', '')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        this.data = [];
        this.clearExcelData();
        this.cancelExcelUpload();
        //this.router.navigate(['../assign/list'])
        this.spinner.spinnerOnOff();

      }
    })
  }


  onCancel() {
    this.router.navigate(['../assign']);
  }

  /************************************* METODOS PARA LOS INPUTS *******************************************/
  selectClient(event: any) {
    this.requiredIdClient = event.value;
  }

  // Método para manejar la selección de archivo
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

  /****************************************** OTHER METHODS **********************************************/


  // Método para convertir datos para mostrar en la tabla dinámica
  convertDataForTable(data: any[]): any[] {
    return data.map(item => ({
      idService: item.idService,
      serviceName: item.serviceName,
      idServiceProv: item.idServiceProv,
      codProveedor: item.codProveedor,
      status: item.status,
      ownComissionType: item.ownComissionType,
      ownComission: item.ownComission,
      ownComission2: item.ownComission2,
      ownCriterionComission: item.ownCriterionComission,
      zone: item.zone
    }));
  }

  // Método para convertir datos de Excel al formato de asignación
  convertExcelToAssignmentFormat(excelData: any[]): any[] {
    const idProvider = "00000100"; // ID fijo del proveedor
    const REQUIRED_COLUMNS = ["CÓDIGO DE SERVICIO", "NOMBRE DE SERVICIO", "CODIGO DE SERVICIO DEL PROVEEDOR", "CODIGO DEL PROVEEDOR",
      "ESTADO", "TIPO DE COMISION", "VALOR DE COMISION PRINCIPAL"
    ];

    // Validar que haya datos
    if (!excelData || excelData.length === 0) {
      this.mytoastr.showWarning('Error', 'El archivo Excel está vacío.');
      return [];
    }

    // Validar que todas las columnas requeridas estén presentes
    const headers = Object.keys(excelData[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      this.mytoastr.showWarning('Error', `Faltan las siguientes columnas requeridas: ${missingColumns.join(", ")}`);
      return [];
    }

    return excelData.map(row => {
      const jsonObj = {
        idProvider: idProvider,
        idClient: this.requiredIdClient, // Usar el ID Cliente ingresado
        idService: row["CÓDIGO DE SERVICIO"] || "",
        serviceName: row["NOMBRE DE SERVICIO"] || "",
        idServiceProv: row["CODIGO DE SERVICIO DEL PROVEEDOR"] || "",
        codProveedor: row["CODIGO DEL PROVEEDOR"] || "",
        userRegistration: this.cookies.get('person_id') || 'desconocido',
        status: row["ESTADO"] || "",
        zone: "MULTIDEPARTAMENTAL",
        ownFixedComission: "",
        ownCriterionComission: "",
        ownPCTComission: "",
        ownComissionRange: "",
        ownComission: row["VALOR DE COMISION PRINCIPAL"] || "",
        ownComission2: row["VALOR DE COMISION SECUNDARIA"] || "",
        comissionRange: "",
        ownComissionType: "",
        comissionFixed: "",
        comissionPCT: "",
      };

      const tipoComision = row["TIPO DE COMISION"] || "";
      const valorComision = row["VALOR DE COMISION PRINCIPAL"] || "";
      const valorComision2 = row["VALOR DE COMISION SECUNDARIA"] || "";
      const valorCriterio = row["CRITERIO DE COMISION"] || "";

      // Lógica de comisiones del script original
      if (tipoComision === "Comisión fija") {
        jsonObj.ownComissionType = "FIJO";
        jsonObj.comissionFixed = valorComision;
        jsonObj.ownFixedComission = valorComision;
      } else if (tipoComision === "Comsión porcentual sobre el monto" ||
        tipoComision === "Comisión porcentual sobre el monto") {
        jsonObj.ownComissionType = "PORCENTUAL";
        jsonObj.ownPCTComission = valorComision;
        jsonObj.comissionPCT = valorComision;
      } else if (tipoComision === "Comisión Múltiple") {
        jsonObj.ownComissionType = "MULTIPLE";
        jsonObj.ownPCTComission = valorComision2;
        jsonObj.comissionPCT = valorComision2;

        jsonObj.comissionFixed = valorComision;
        jsonObj.ownFixedComission = valorComision;

        jsonObj.ownCriterionComission = valorCriterio;
      } else if (tipoComision === "Comisión fija segun monto") {
        jsonObj.ownComissionType = "RANGO";

        const comisionRange = JSON.stringify({ upper: Number.parseFloat(valorComision2), lower: Number.parseFloat(valorComision) });
        jsonObj.comissionRange = comisionRange;
        jsonObj.ownComissionRange = comisionRange;

        jsonObj.ownCriterionComission = valorCriterio;
      }

      return jsonObj;
    });
  }


  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragOver = false;

    const files = event.dataTransfer?.files;

    if (files && files.length > 0) {
      const file = files[0];

      const validExtensions = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (validExtensions.includes(file.type)) {
        this.selectedFile = file;
      } else {
        console.error('Archivo inválido');
      }
    }
  }
  downloadTemplate() {
    const dialogRef = this.dialog.open(DialogTemplateAssignServiceComponent
      , {
        width: '900px',
        maxHeight: '80vh'
      });

    dialogRef.afterClosed().subscribe(result => {

    });
  }
}