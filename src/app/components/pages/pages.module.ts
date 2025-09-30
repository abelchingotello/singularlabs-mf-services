import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages.routing.module';
import { HttpClientModule } from '@angular/common/http';
import { LibraryModule } from '../library/library.module';
import { MatDialogModule } from '@angular/material/dialog';
import { ImportServicesComponent } from './services/import-service/import-services.component';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { StatusConciliationComponent } from './status-conciliation/status-conciliation.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DialogPersonaStatusComponent } from 'src/app/dialogs/dialog-persona-status/dialog-persona-status.component';



@NgModule({
  declarations: [
    ImportServicesComponent,
    StatusConciliationComponent,
    DialogPersonaStatusComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    PagesRoutingModule,
    HttpClientModule,
    LibraryModule,
    MatDialogModule,
    MaterialModule,
  ]
})
export class PagesModule { 
}

