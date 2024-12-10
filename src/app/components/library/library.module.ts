import { NgModule, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { SpinnerComponent } from './spinner/spinner.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImageCardComponent } from './image-card/image-card.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { InputPhoneComponent } from './input-phone/input-phone.component';
import { UserFormComponent } from './user-form/user-form.component';
import { SearchSelectComponent } from './search-select/search-select.component';
import { ContactFormComponent } from './contact-form/contact-form.component';

@NgModule({
  declarations: [
    SpinnerComponent,
    ImageCardComponent,
    SearchSelectComponent,
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatOptionModule,
    FormsModule,
    ReactiveFormsModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    InputPhoneComponent,
    UserFormComponent,
    ContactFormComponent,
    DynamicTableComponent
  ],
  exports:[
    SpinnerComponent,
    ImageCardComponent,
    InputPhoneComponent,
    UserFormComponent,
    ContactFormComponent,
    DynamicTableComponent
  ]
})
export class LibraryModule { }
