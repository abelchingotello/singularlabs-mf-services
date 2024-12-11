import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages.routing.module';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/modules/shared/shared.module';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PagesRoutingModule,
    HttpClientModule,
    SharedModule,
  ]
})
export class PagesModule { }

