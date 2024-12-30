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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    AppComponent,
    DialogServiceStatusComponent
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
    MatIconModule
  ],
  providers: [interceptorSpringProvider],
  bootstrap: [AppComponent]
})
export class AppModule { }
