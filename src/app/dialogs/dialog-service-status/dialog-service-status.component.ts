import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

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
    private service : ServicesService,
    private mytoastr :  MytoastrService
  ) { }

   ngOnInit(): void {
    console.log("respuesta de servicio",this.data)
    this.initializaForms();

    if(this.data.id=='2') this.stateIdEntity = true
    if(this.data.id=='3') {
      this.stateIdClient = true
      this.stateIdEntity = true
    }


    this.service_entity.setValue(this.data.idProvider.person.name)
    this.service_client.setValue(this.data.idClient.person.name)
    this.service_id.setValue(this.data.resp.data[0].id)
    this.service_business.setValue(this.data.resp.data[0].business)
    this.service_description.setValue(this.data.resp.data[0].description)
    // this.service_collectingEntity.setValue(this.data.resp.collectingEntity)
    this.service_serviceType.setValue(this.data.resp.data[0].serviceType.name);
    this.stateMaster = this.data.state;
    this.formEntity.disable();

  }

  initializaForms() {
    this.formEntity = this.form.group({
      entity : [''],
      client : [''],
      id: [''],
      business: [''],
      serviceType: [''],
      description: [''],
      // collectingEntity: [''],
    })
  }

  caseOptionIdService(){
   switch (this.data.id){
    case '1':
      this.updateServic();
      console.log("INGRESO AL 1")
      break;
    case '2':
      console.log("INGRESO AL 2")
      this.updateServicEntity();
      break;
    case '3':
      console.log("INGRESO AL 3")
      this.updateServicClient();
      break;
   }
  }

  updateServic(){
    const data = {
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE1:",data)
    // return
    this.service.updateService(data).subscribe(
      (data) => {
        console.log("respuesta del servicio", data)
        if(data?.statusCode !==200){
          this.mytoastr.showError('Error al actualizar','')
          return
        }
        this.onNoClick();
        this.mytoastr.showSuccess('Actualización correcta','')
      },

    )
  }
  updateServicEntity(){
    const data = {
      idProvider: this.data.idProvider.id ,
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE2:",data)
    // return
    this.service.updateServiceEntity(data).subscribe(
      (data) => {
        console.log("Respuesta del servicio ", data)
        if(data?.statusCode !==200){
          this.mytoastr.showError('Error al actualizar','')
          return
        }
        this.onNoClick();
        this.mytoastr.showSuccess('Actualización correcta','')
      }
    )
  }
  updateServicClient(){
    const data = {
      idProvider: this.data.idProvider.id,
      idClient: this.data.idClient.id,
      idService: this.service_id.value,
      status: this.status.master_name
    }
    console.log("UPDATE3:",data)
    // return
    this.service.updateServiceClient(data).subscribe(
      (data) => {
        console.log("Respuesta del servicio", data)
        if(data?.statusCode !==200){
          this.mytoastr.showError('Error al actualizar','')
          return
        }
        this.onNoClick();
        this.mytoastr.showSuccess('Actualización correcta','')
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
  // get service_collectingEntity(){
  //   return this.formEntity.get('collectingEntity')
  // }
  get service_entity(){
    return this.formEntity.get('entity')
  }
  get service_client(){
    return this.formEntity.get('client')
  }

}

export interface DialogData {
  resp: any;
  id: string;
  state: any;
  idClient:any;
  idProvider:any
}
