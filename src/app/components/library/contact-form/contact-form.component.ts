import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibraryModule } from '../library.module';
// import { SharedModule } from 'src/app/modules/shared/shared.module';
import { MasterService } from 'src/app/services/master.service';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { DynamicTableComponent } from '../dynamic-table/dynamic-table.component';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatOptionModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class ContactFormComponent implements OnInit {
  @Output() contactCreated = new EventEmitter<any>(); // Evento para emitir el objeto del formulario
  public contactForm!: FormGroup;
  public REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  documentTypes: any;
  genders: any;
  departaments: any;
  entityTypes: any;
  personForm: any;
  filteredDepartaments: any[];
  filteredEntityTypes: any[];

  constructor(
  private fb: FormBuilder,
  private masterService: MasterService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {

    this.contactForm = this.fb.group({
      person_id: [''],
      person_firstName: ['', [Validators.required]],
      person_lastName: ['', [Validators.required]],
      person_email: ['', [Validators.email, Validators.required, Validators.pattern(this.REGEX_EMAIL)]],
      person_phone: [''],
      person_docType:['DNI', [Validators.required]],
      person_docNumber: ['', [Validators.required]],
      
    })
  }


  listData() {
    forkJoin([
      this.masterService.getItemsMasterTable('6'), // Tipos de documentos de identidad
      // this.masterService.getItemsMasterTable('7'),// Géneros
      this.masterService.getItemsMasterTable('8')  // Tipo de entidades
    ]).subscribe({
      next: ([documentTypes, entityTypes]) => {
        this.documentTypes = documentTypes.sort((a, b) => a.master_order - b.master_order);
        // this.genders = genders.sort((a, b) => a.master_order - b.master_order);
        // this.departaments = departaments.sort((a, b) => a.master_order - b.master_order);
        this.entityTypes = entityTypes.sort((a, b) => a.master_order - b.master_order);

        // if (!this.personForm.get('person_docType')?.value && this.documentTypes.length > 0) {
        //   const firstDocType = this.documentTypes[0].master_name;
        //   this.personForm.get('person_docType')?.setValue(firstDocType);
        //   this.updateControlsAndValidators(firstDocType);
        // }

        this.filteredEntityTypes = [...this.entityTypes];
      },
      error: (error) => {
        console.error("Error loading master table data:", error);
      }
    });
  }
  updateControlsAndValidators(firstDocType: any) {
    throw new Error('Method not implemented.');
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.contactCreated.emit(this.contactForm.value); // Emitir los datos del formulario al padre
      this.contactForm.reset();
    }
  }

}

