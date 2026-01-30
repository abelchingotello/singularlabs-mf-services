import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { GenerateQRRoutingModule } from './generateqr.routing.module';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { LibraryModule } from '../../library/library.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GenerateQR } from './generateqr.component';
import { GenerateQrReportsComponent } from './reports/generateqr-reports.component';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DATE_LOCALE } from '@angular/material/core';

registerLocaleData(localeEs);



@NgModule({
  declarations: [
    GenerateQR,
    GenerateQrReportsComponent
  ],
  imports: [
    CommonModule,
    GenerateQRRoutingModule,
    MaterialModule,
    LibraryModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class GenerateQRModule { }
