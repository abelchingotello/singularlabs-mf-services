import { Component, Input, Output, OnInit, AfterViewInit, ViewChild, EventEmitter, ChangeDetectorRef, ElementRef, OnChanges, SimpleChanges, Inject, OnDestroy, } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule, formatDate } from '@angular/common';
import { utils, WorkBook } from 'xlsx';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IconTypeComponent } from './../icons_type/icons_type.component';

import { AuthService } from 'src/app/services/auth.service';

// Agregar propiedad para manejar la suscripción
@Component({
  selector: 'uni-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  standalone: true,
  imports: [
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
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    IconTypeComponent,
  ],
})
export class DynamicTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() actionsOptions?: boolean;
  @Input() element_id?: string | string[] | 'ALL';
  @Input() pageKey: any;
  @Input() refreshFunction!: () => void;
  @Input() alwaysShowHeaderOptions: boolean;

  // Export personalizado
  @Input() customExportFunction: ((fileType: 'xlsx' | 'csv') => void) | null = null;

  @Input() viewOptionsTable: boolean = true;
  @Input() viewCheckboxHeader: boolean = true;

  @Input() lengthTable: any;
  @Input() paginationinFrontend: any;
  @Input() shouldExport: boolean = false;
  @Input() showExport: boolean = true;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];
  @Input() currentPageIndex: number = 0;

  @Output() toggleChange = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() clickButtonEvent = new EventEmitter<any>();
  @Output() selectedIdsChange = new EventEmitter<any[]>();
  @Output() selectedChange = new EventEmitter<any[]>();
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
  public selectedTab: string = 'tab1';
  public styleString: string = '';
  public isLoadingResults = true;
  public selectedIds: any[] = [];
  public currentEventPage: PageEvent;
  public isCheckedClass: any;
  public pageSize = 5;
  public paginatorLength: any;
  public dataCurrent: boolean;
  public previousDataLength = 0;// 1. Agregar el import

  // 2. Nuevas propiedades públicas (junto a las demás)
  public action_permision: any = {};
  public actions_visible: boolean = false;

  private permissionsSub: Subscription;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    @Inject(MatPaginatorIntl) private readonly paginatorIntl: MatPaginatorIntl
  ) {
    this.paginatorIntl.itemsPerPageLabel = 'Elementos por página';
  }

  ngOnInit(): void {
    this.updateColumnsFromConfig();
    this.dataSource = new MatTableDataSource(this.data);
    this.dataPrint = new MatTableDataSource(this.data);

    // ✅ Suscribirse al observable en vez de llamar getPermissions()
    // BehaviorSubject emite el valor actual inmediatamente + futuros cambios de rol
    this.permissionsSub = this.authService.permissions$.subscribe(permissions => {
      if (!permissions || Object.keys(permissions).length === 0) return;

      const allPermissionFromRol: any = {};
      this.actions_visible = false; // resetear en cada emisión

      const columnAction = this.columns.find(
        (column: any) =>
          column.config?.type === 'buttonicons' &&
          column.config?.actions?.length > 0
      );

      columnAction?.config?.actions.forEach((action: any) => {
        allPermissionFromRol[action.permission] = this.authService.hasPermissionFromTag(action.permission);
        if (allPermissionFromRol[action.permission]) {
          this.actions_visible = true;
        }
      });

      this.action_permision = { ...allPermissionFromRol };
      this.updateColumnsFromConfig();
      this.changeDetectorRef.detectChanges();
    });
  }

  // Limpiar suscripción al destruir el componente
  ngOnDestroy(): void {
    this.permissionsSub?.unsubscribe();
  }
  // 5. Nuevos métodos (añadir al final de la clase)
  async getPermissions(columns: any): Promise<void> {
    await this.authService.getPermissions();
    const allPermissionFromRol: any = {};

    const columnAction = columns.find(
      (column: any) =>
        column.config?.type === 'buttonicons' &&
        column.config?.actions?.length > 0
    );

    columnAction?.config?.actions.forEach((action: any) => {
      allPermissionFromRol[action.permission] = this.hasPermission(action.permission);
      if (allPermissionFromRol[action.permission]) {
        this.actions_visible = true;
      }
    });

    this.action_permision = { ...allPermissionFromRol };
  }

  hasPermission(tag: any): boolean {
    return this.authService.hasPermissionFromTag(tag);
  }
  ngAfterViewInit(): void {
    this.initTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageKey']) {
      if (changes['data']) {
        this.dataSource.data = this.data;
        this.dataPrint.data = this.data;
      }

      if (this.paginationinFrontend) {
        // paginación en frontend
      } else {
        // paginación en backend
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = this.lengthTable;
            this.changeDetectorRef.detectChanges();
          }
        });
      }

      this.initTable();
    }

    if (changes['columns']) {
      this.updateColumnsFromConfig();
    }
  }

  /** Recalcula displayedColumns y attributeNames respetando column.hide */
  private updateColumnsFromConfig(): void {
    const visibleColumns = this.columns?.filter(
      c => !c?.config?.restriccPermission || this.actions_visible  // ← agregar condición
    ) || [];
    this.displayedColumns = visibleColumns.map(column => column.name);
    this.attributeNames = visibleColumns.map(column => column.attribute);
  }

  initTable() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.obs = this.dataSource.connect();
  }

  updateSort(callback?: () => void) {
    this.changeDetectorRef.detectChanges();
    this.updateColumnsFromConfig();
    this.dataSource.data = this.data;
    this.initTable();
    callback?.();
  }

  /** displayedColumns + select cuando hay acciones */
  get displayedColumnsWithSelect(): string[] {
    return this.actionsOptions ? ['select', ...this.displayedColumns] : this.displayedColumns;
  }

  onToggleChange(element: any, event: any): void {
    this.toggleChange.emit({ element, checked: event.checked });
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
    } else {
      this.selection.select(...this.dataSource.data);
      this.getSelectedIds();
    }
  }

  clearSelection() {
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
    if (!this.element_id) {
      console.warn('element_id no está definido');
      return;
    }

    if (this.element_id === 'ALL') {
      this.selectedIds = this.selection.selected;
    } else if (typeof this.element_id === 'string') {
      this.selectedIds = this.selection.selected.map(row => row[this.element_id.toString()]);
    } else if (Array.isArray(this.element_id)) {
      const element: any[] = this.element_id;
      this.selectedIds = this.selection.selected.map(row => {
        const result: { [key: string]: any } = {};
        element.forEach(field => {
          if (row[field]) {
            result[field] = row[field];
          }
        });
        return result;
      });
    } else {
      console.warn('Formato de element_id no reconocido');
      return;
    }

    this.headerOptions = this.selectedIds.length !== 0;
    this.selectedIdsChange.emit(this.selectedIds);
    this.selectedChange.emit(this.selection.selected);
  }

  onSelectionChange() {
    this.updateSort();
  }

  onPageChange(event: PageEvent) {
    // Always propagate paginator changes to parent (backend pagination).
    this.pageChange.emit(event);
    this.pageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
  }

  onCellClick(value: any) {
    this.cellClick.emit(value);
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
          <div>Información actualizada al: ${date}</div>
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
    }, 1000);
  }

  getStyles() {
    this.http
      .get('../dynamic-table/dynamic-table.component.scss', { responseType: 'text' })
      .subscribe(styleSheet => {
        this.styleString = styleSheet;
      });
  }

  componentStyles(): string {
    let styles = '';
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(styleElement => {
      styles += styleElement.textContent;
    });
    return styles;
  }

  formatDate(date: any, format: string, locale: string) {
    if (!date) {
      return '';
    }
    return formatDate(date, format, locale);
  }

  private createWorkbook(sheetName: string, isCsv: boolean = false): WorkBook {
    const headers = [this.displayedColumns];
    const wb = utils.book_new();
    const ws: any = utils.json_to_sheet([]);

    utils.sheet_add_aoa(ws, headers);
    utils.sheet_add_json(ws, this.filterAttributes(), {
      origin: 'A2',
      skipHeader: true,
    });

    utils.book_append_sheet(wb, ws, sheetName);
    return wb;
  }

  onClickButton(value: any, element: any) {
    const event = { value, element };
    this.clickButtonEvent.emit(event);
  }

  exportExcel() {
    if (this.customExportFunction) {
      this.customExportFunction('xlsx');
    }
  }

  exportCsv() {
    if (this.customExportFunction) {
      this.customExportFunction('csv');
    }
  }

  filterAttributes() {
    const columnConfigMap = new Map<string, any>(
      this.columns.map(column => [column.attribute, column.config])
    );

    return this.data.map(item => {
      const newObj: { [key: string]: any } = {};

      for (const attribute of this.attributeNames) {
        const columnConfig = columnConfigMap.get(attribute);
        let value = item[attribute];

        if (!value) {
          newObj[attribute] = '';
          break;
        }

        if (columnConfig?.formatDate) {
          value = formatDate(value, columnConfig.formatDate.format, columnConfig.formatDate.locale);
        }

        newObj[attribute] = value;
      }

      return newObj;
    });
  }
}
