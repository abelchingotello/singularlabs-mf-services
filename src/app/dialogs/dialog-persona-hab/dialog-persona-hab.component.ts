import { PersonService } from 'src/app/services/person2.service';
import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master2.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dialog-persona-hab',
  templateUrl: './dialog-persona-hab.component.html',
  styleUrls: ['./dialog-persona-hab.component.scss']
})
export class DialogPersonaHabComponent implements OnInit {
  public stateMaster : any;
  public person :string = ''
  public form : FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DialogPersonaHabComponent>,
    @Inject(MAT_DIALOG_DATA) 
    public data: DialogData,
    private masterService : MasterService,
    private personService : PersonService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // this.initialForm();
    this.masterService.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });
    this.person = (this.data.id.nameAlias);
    console.log(this.data.id.nameAlias);
  }

  initialForm(){
    this.form = this.fb.group({
      person: [''], // Inicializa con un valor vacío
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
      idPerson:this.data.id.id,
      status:this.stateOption
    }
    console.log( "data",data)
    // return
    this.personService.getStatePerson(data).subscribe(
      (response) => {
        if(response?.statusCode !==200){
          console.log("ERROR")
          return
        }
        console.log("RESPUESTA", response)
      }
    )
  }

  get form_person(){
    return this.form.get('person')
  }


}


export interface DialogData {
  id: any;
}
