import { Component, Input, Output, OnInit, AfterViewInit, ViewChild, EventEmitter, ChangeDetectorRef, ElementRef, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CommonModule, formatDate } from '@angular/common';
import * as XLSX from 'xlsx';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, NgModel } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'uni-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  standalone: true,
  imports:[
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule
  ]
})
export class DynamicTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() actionsOptions?: boolean;
  @Input() element_id?: string | string[] | 'ALL';
  @Input() pageKey: any;
  @Input() refreshFunction!: () => void;
  @Input() alwaysShowHeaderOptions: boolean;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() selectedIdsChange = new EventEmitter<any[]>();
  @Output() cellClick: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild('table') element: ElementRef;

  public displayedColumns: string[] = [];
  public attributeNames: string[] = [];
  public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  public dataPrint: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  public selection = new SelectionModel<any>(true, []);
  public headerOptions: boolean = false;
  public obs!: Observable<any>;
  public selectedTab: string = "tab1";
  public styleString: string = '';
  public isLoadingResults = true; //Revisar
  public selectedIds: any[] = [];
  public currentEventPage: PageEvent;
  public isCheckedClass: any; //NgModel Class Div Seleccionado
  public pageSize = 5;
  public paginatorLength: any;
  public dataCurrent: boolean;
  public previousDataLength = 0;

  constructor(private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient,
    @Inject(MatPaginatorIntl) private paginatorIntl: MatPaginatorIntl) {
    this.paginatorIntl.itemsPerPageLabel = 'Elementos por página';
  }

  ngOnInit(): void {
    this.displayedColumns = this.columns.map(column => column.name);
    this.attributeNames = this.columns.map(column => column.attribute);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataPrint = new MatTableDataSource(this.data);
    this.selectedTab.toLowerCase();
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageKey']) {
      // Actualiza el dataSource si los datos han cambiado
      if (changes['data']) {
        this.dataSource.data = this.data;
        this.dataPrint.data = this.data;
      }
  
      // Verificar si se ha modificado pageKey o si ha cambiado el tamaño de los datos
      if (this.pageKey) {
        // Si hay un pageKey válido o los datos han aumentado de tamaño, activamos hasNextPage
        this.paginator.hasNextPage = () => true;
      }else{
        // this.paginator.hasNextPage = () => false;
      }
  
      // Actualizar el tamaño anterior de los datos para futuras comparaciones
  
      // Iniciar o reiniciar la tabla
      this.initTable();
    }
  
    if (changes['columns']) {
      // Actualizamos las columnas visibles y los atributos de las columnas cuando cambien
      this.displayedColumns = this.columns.map(column => column.name);
      this.attributeNames = this.columns.map(column => column.attribute);
    }
  }

  initTable() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.obs = this.dataSource.connect();
  }

  updateSort(callback?: () => void) {
    this.changeDetectorRef.detectChanges();
    this.displayedColumns = this.columns.map(column => column.name);
    this.attributeNames = this.columns.map(column => column.attribute);
    this.dataSource.data = this.data;
    this.initTable();
    console.log('updatesort ejecutado');
    callback?.();
    console.log(this.data);
  }

  get displayedColumnsWithSelect(): string[] {
    return this.actionsOptions ? ['select', ...this.displayedColumns] : this.displayedColumns;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.getSelectedIds();
      console.log('limpio');
    } else {
      this.selection.select(...this.dataSource.data);
      console.log('nuevos');
      this.getSelectedIds();
    }
  }

  clearSelection() { //Limpieza de elecciones despues de cada add, edit O...
    this.selectedIds = [];
    this.selection.clear();
    this.selectedIdsChange.emit(this.selectedIds);
    this.headerOptions = false;
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  getSelectedIds() {
    // Verificar que `element_id` está definido
    if (!this.element_id) {
        console.warn("element_id no está definido");
        return;
    }
  
    if(this.element_id === 'ALL'){
      this.selectedIds = this.selection.selected;
    }
    // Si `element_id` es un string, manejarlo como un solo campo
    else if (typeof this.element_id === 'string') {
        this.selectedIds = this.selection.selected.map(row => row[this.element_id.toString()]);
    }
    // Si `element_id` es un array de strings, extraer múltiples campos
    else if (Array.isArray(this.element_id)) {
      let element: any[] = this.element_id
        this.selectedIds = this.selection.selected.map(row => {
            let result: { [key: string]: any } = {};
            element.forEach(field => {
                if (row[field]) {
                    result[field] = row[field];  // Extraer el valor de cada campo
                }
            });
            return result;
        });
    } else {
        console.warn("Formato de element_id no reconocido");
        return;
    }

    // Activar o desactivar opciones del encabezado según el resultado
    this.headerOptions = this.selectedIds.length !== 0;

    // Emitir los IDs seleccionados
    this.selectedIdsChange.emit(this.selectedIds);
}

  onSelectionChange() {
    this.updateSort();
  }

  onPageChange(event: PageEvent) {
    if (event.pageSize * (event.pageIndex + 1) >= event.length) {

      if (this.pageKey) {
        this.pageChange.emit(event);
      }
    }
    delete this.paginator.hasNextPage;
    this.pageSize = event.pageSize;
  }

  onCellClick(value: any) {
    this.cellClick.emit(value);  // Emitir el valor clicado al componente padre
  }

  print() {
    const tableElement = this.element.nativeElement.querySelector('table');
    const clonedTable = tableElement.cloneNode(true);
    const styles = this.componentStyles();
    const date = formatDate(new Date(), 'dd-MM-yyyy', 'en-US');
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
            <html>
              <head>
                <title>Imprimir tabla</title>
                <style>${styles}</style>
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body>
              <div>
              Información actualizada al: ${date}
              </div>
                ${clonedTable.outerHTML}
              </body>
            </html>
          `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 1000); // Ajusta el tiempo según sea necesario
  }

  getStyles() {
    this.http.get('../dynamic-table/dynamic-table.component.scss', { responseType: 'text' }).subscribe(
      styleSheet => {
        this.styleString = styleSheet;
      }
    );
  }

  componentStyles(): string {
    let styles = '';
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach((styleElement) => {
      styles += styleElement.textContent;
    });
    return styles;
  }

  formatDate(date, format, locale) {
    if(!date){
      return '';
    }
    return formatDate(date, format, locale);
  }

  private createWorkbook(sheetName: string, isCsv: boolean = false): XLSX.WorkBook {
    const headers = [this.displayedColumns];
    const wb = XLSX.utils.book_new();
    const ws: any = XLSX.utils.json_to_sheet([]);

    // Agrega los encabezados
    XLSX.utils.sheet_add_aoa(ws, headers);

    // Agrega los datos filtrados
    XLSX.utils.sheet_add_json(ws, this.filterAttributes(), {
      origin: 'A2',
      skipHeader: true
    });

    // Agrega la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    return wb;
  }

  exportExcel() {
    const wb = this.createWorkbook('Users');
    const ws = wb.Sheets['Users'];

    // Ajusta el ancho de las columnas según el contenido
    const columnWidths = this.columns.map(col => {
      const maxWidth = Math.max(
        col.name.length, // Longitud del encabezado
        ...this.filterAttributes().map(item => (item[col.attribute] ? item[col.attribute].toString().length : 0)) // Longitud de los valores
      );
      return { wpx: maxWidth * 10 }; // Multiplica por un factor para un mejor ajuste visual
    });

    // Establece los anchos de las columnas
    ws['!cols'] = columnWidths;

    XLSX.writeFile(wb, 'Excel tabla.xlsx');
  }

  exportCsv() {
    const wb = this.createWorkbook('Users', true);
    const ws = wb.Sheets['Users'];

    // Convierte la hoja a CSV con cada valor entre comillas
    const csv = XLSX.utils.sheet_to_csv(ws, {
      FS: ',',
      RS: '\n',
      // Envolver cada campo en comillas dobles
      forceQuotes: true, // Utiliza quoteColumns para asegurar que todos los campos estén entre comillas
    });

    // Crea un archivo CSV y dispara la descarga
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'tabla.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  filterAttributes() {
    // Mapa de configuración de columnas para un acceso rápido
    const columnConfigMap = new Map<string, any>(
      this.columns.map(column => [column.attribute, column.config])
    );

    return this.data.map(item => {
      const newObj: { [key: string]: any } = {};

      // Recorre las claves que se desean filtrar
      for (const attribute of this.attributeNames) {
        // Obtiene la configuración de la columna de forma eficiente
        const columnConfig = columnConfigMap.get(attribute);
        let value = item[attribute];
        
        if(!value){ //Evitar errores cuando el elemento no contiene el atributo
          newObj[attribute] = '';
          break;
        }

        // Formatear la fecha si se especifica en la configuración de la columna
        if (columnConfig?.formatDate) {
          value = formatDate(value, columnConfig.formatDate.format, columnConfig.formatDate.locale);
        }

        newObj[attribute] = value; // Asignar el valor (formateado o no) al nuevo objeto
      }

      return newObj;
    });
  }

}
