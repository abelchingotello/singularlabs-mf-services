import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master.service';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'uni-dialog-service-status',
  templateUrl: './dialog-service-status.component.html',
  styleUrls: ['./dialog-service-status.component.scss']
})
export class DialogServiceStatusComponent implements OnInit {

  public formEntity!: FormGroup;
  public stateMaster : any;
  public stateIdEntity : boolean = false;
  public stateIdClient : boolean = false;

  constructor(
    private form: FormBuilder,
    public dialogRef: MatDialogRef<DialogServiceStatusComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private master: MasterService,
    private service : ServicesService
  ) { }

  ngOnInit(): void {
    console.log("respuesta de servicio",this.data)
    this.initializaForms();

    if(this.data.id=='2') this.stateIdEntity = true
    if(this.data.id=='3') this.stateIdClient = true
    
    this.master.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      }
    });

    this.service_id.setValue(this.data.resp.data[0].id)
    this.service_business.setValue(this.data.resp.data[0].business)
    this.service_description.setValue(this.data.resp.data[0].description)
    this.service_collectingEntity.setValue(this.data.resp.collectingEntity)
    this.service_serviceType.setValue(this.data.resp.data[0].serviceType.name)
    this.formEntity.disable();

  }

  dataIdService(){

  }

  initializaForms() {
    this.formEntity = this.form.group({
      entity : ['BBVA'],
      client : ['BANCO'],
      id: [''],
      business: [''],
      serviceType: [''],
      description: [''],
      collectingEntity: [''],
    })
  }

  updateServic(){
    const data = {
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE:",data)
    // return
    this.service.updateService(data).subscribe(
      (data) => {
        console.log("servicio actualizado", data)
      }
    )
  }
  updateServicEntity(){
    const data = {
      idProvider: this.service_entity.value ,
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE:",data)
    // return
    this.service.updateServiceEntity(data).subscribe(
      (data) => {
        console.log("servicio actualizado", data)
      }
    )
  }
  updateServicClient(){
    const data = {
      idProvider: this.service_entity.value,
      idClient: this.service_client.value,
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE:",data)
    // return
    this.service.updateServiceClient(data).subscribe(
      (data) => {
        console.log("servicio actualizado", data)
      }
    )
  }

  status:any
  stateSelect(event){
    this.status  = event.value
  }


  onNoClick(): void {
    this.dialogRef.close();
  }


  get service_id(){
    return this.formEntity.get('id')
  }
  get service_business(){
    return this.formEntity.get('business')
  }
  get service_serviceType(){
    return this.formEntity.get('serviceType')
  }
  get service_description(){
    return this.formEntity.get('description')
  }
  get service_collectingEntity(){
    return this.formEntity.get('collectingEntity')
  }
  get service_entity(){
    return this.formEntity.get('entity')
  }
  get service_client(){
    return this.formEntity.get('client')
  }

}

export interface DialogData {
  resp: any;
  id: string
}
