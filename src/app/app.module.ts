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
    HttpClientModule 
  ],
  providers: [interceptorSpringProvider],
  bootstrap: [AppComponent]
})
export class AppModule { }
