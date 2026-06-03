import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { interceptorSpringProvider } from './interceptors/app.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { LibraryModule } from './components/library/library.module';
import { HttpClientModule } from '@angular/common/http';
import { DialogServiceStatusComponent } from './dialogs/dialog-service-status/dialog-service-status.component';
import { DialogCommissionAssingServiceComponent } from './dialogs/dialog-comision-assing-service/dialog-comision-assing-service.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogServiceConfigComponent } from './dialogs/dialog-service-config/dialog-service-config.component';
import { DialogServiceAssignProviderStatusComponent } from './dialogs/dialog-service-assign-provider-status/dialog-service-assign-provider-status.component';
import { DialogTemplateAssignServiceComponent } from './dialogs/dialog-template-assign-services/dialog-template-assign-services.component';

@NgModule({
  declarations: [
    AppComponent,
    DialogServiceStatusComponent,
    DialogServiceAssignProviderStatusComponent,
    DialogCommissionAssingServiceComponent,
    DialogServiceConfigComponent,
    DialogTemplateAssignServiceComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LibraryModule,
    ToastrModule.forRoot(),
    HttpClientModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
  ],
  providers: [interceptorSpringProvider],
  bootstrap: [AppComponent]
})
export class AppModule { }
