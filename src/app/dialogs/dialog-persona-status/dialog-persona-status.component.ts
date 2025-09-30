import { PersonService } from 'src/app/services/person2.service';
import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master2.service';
import { FormBuilder, FormGroup } from '@angular/forms';

import { MytoastrService } from 'src/app/services/mytoastr';

@Component({
  selector: 'app-dialog-persona-status',
  templateUrl: './dialog-persona-status.component.html',
  styleUrls: ['./dialog-persona-status.component.scss']
})
export class DialogPersonaStatusComponent implements OnInit {
  public stateMaster : any;
  public personInput :string = ''
  public status : string = ''
  public form : FormGroup;
  public personId: number;
  public entity: string = '';
  public entityType: string = '';

  constructor(
    public dialogRef: MatDialogRef<DialogPersonaStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nameAlias: string; id: number; entityType: string; checked: boolean},
    private masterService : MasterService,
    private personService : PersonService,
    private fb: FormBuilder,
    
    private myToastr : MytoastrService,
  ) { 
    //this.personId = data.id;  // 👈 aquí recibimos el id opcionalmente o en nginit
    }

  ngOnInit(): void {
    // this.initialForm();
    this.masterService.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });
    
    this.personId = (this.data.id);  // 👈 aquí recibimos el id
    this.personInput = (this.data.nameAlias);
    this.entityType = (this.data.entityType);
    this.status = (this.data.checked == true) ? 'HABILITADO' : 'INHABILITADO';//mostrar cambio deseado
    
    console.log("data.id: "+ (this.data.id));
    console.log("data.nameAlias: "+this.data.nameAlias);
    console.log("data.entityType: "+this.data.entityType);
    console.log("data.status: "+this.status);
    
  }

  initialForm(){
    this.form = this.fb.group({
      personInput: [''], // Inicializa con un valor vacío
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  disableDialog(){
    console.log("DESACTIVAR: ")
  }

  stateOption
  stateType(event){
    console.log("data de dialog: ",this.data)
    this.stateOption= event.value.master_name
  }

  updatestate(){
    const data = {
      idPerson:this.personId,
      nameAlias: this.personInput,
      entityType: this.entityType,
      status: this.status
    }
    console.log( "data: aa",data)
    // return
    this.personService.patchStatePerson(data).subscribe(
      (response) => {
        if(response?.statusCode !==200){
        this.myToastr.showError('Hubo un error al actualizar','')
          console.log("ERROR")
          return
        }
        
        this.myToastr.showSuccess(response.message,'')
        console.log("RESPUESTA", response)
        
        // 🔹 Devolver algo al cerrar el modal para que el padre sepa que debe refrescar
        this.dialogRef.close(true);
      }
    )
  }

  
  get form_person(){
    return this.form.get('personInput')
  }


}


export interface DialogData {
  id: any;
}
