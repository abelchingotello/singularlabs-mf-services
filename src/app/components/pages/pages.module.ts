import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages.routing.module';
import { HttpClientModule } from '@angular/common/http';
import { LibraryModule } from '../library/library.module';
import { MatDialogModule } from '@angular/material/dialog';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PagesRoutingModule,
    HttpClientModule,
    LibraryModule,
    MatDialogModule
  ]
})
export class PagesModule { }

