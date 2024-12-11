import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LibraryModule } from 'src/app/components/library/library.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MaterialModule,
    LibraryModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports:[
    MaterialModule,
    LibraryModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
