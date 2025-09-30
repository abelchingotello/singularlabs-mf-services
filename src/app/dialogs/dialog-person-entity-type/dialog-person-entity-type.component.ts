import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master2.service';
import { PersonService } from 'src/app/services/person2.service';
@Component({
  selector: 'app-dialog-person-entity-type',
  templateUrl: './dialog-person-entity-type.component.html',
  styleUrls: ['./dialog-person-entity-type.component.scss']
})
export class DialogPersonEntityTypeComponent implements OnInit {
  public stateMaster : any;
  constructor(
        public dialogRef: MatDialogRef<DialogPersonEntityTypeComponent>,
        @Inject(MAT_DIALOG_DATA) 
        public data: DialogData,
        private masterService : MasterService,
        private personService : PersonService
  ) { }
  statusOption
  ngOnInit(): void {
    console.log("DATA DE PERSONS: ",this.data)
    this.stateMaster = this.data.state
    this.statusOption = this.data.options
    // this.masterService.getItemsMasterTable(11).subscribe({
    //   next: (data) => {
    //     this.stateMaster = data;
    //     console.log("DATAMASTER", data)
    //   }
    // });

    // this.masterService.getItemsMasterTable(1).subscribe({
    //   next: (data) => {
    //     this.statusOption = data;
    //     console.log("DATAESTATUS", data)
    //   }
    // });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  stateOption
  stateType(event){
    console.log("data de dialog: ",event)
    this.stateOption= event.value.master_relativeName
  }
  stateOptionSelect
  stateTypeEntity(event){
    console.log("data de status: ",event)
    this.stateOptionSelect= event.value.master_name
  }

  updatestate(){
    const data = {
      typeEntity:this.stateOption,
      status:  this.stateOptionSelect
    }
    console.log( "data",data)
    // return
    this.personService.getStateTypePerson(data).subscribe(
      (response) => {
        if(response?.statusCode !==200){
          console.log("ERROR")
          return
        }
        console.log("RESPUESTA", response)
      }
    )
  }

}
export interface DialogData {
  state: any;
  options:any
}
