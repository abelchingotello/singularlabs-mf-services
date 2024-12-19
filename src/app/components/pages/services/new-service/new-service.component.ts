import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';

@Component({
    selector: 'uni-new-service',
    templateUrl: './new-service.component.html',
    styleUrls: ['./new-service.component.scss']
})
export class NewServiceComponent implements OnInit {
    public serviceForm!: FormGroup;
    public idService: string;
    public typeService:any ;
    public titlle : string = 'Nuevo Servicio';

    constructor(
        private router: Router,
        private fb: FormBuilder,
        private readonly activeRouter: ActivatedRoute,
        private mytoastr: MytoastrService,
        private service : ServicesService
    ) { }

    ngOnInit(): void {
        this.idService = this.activeRouter.snapshot.params['id'];
        this.initializeFormGroup();
        if(this.idService){
            this.titlle = 'Editar Servicio'
            this.getIdService(this.idService);
        }
        console.log("ID: ", this.idService)
    }

    initializeFormGroup() {
        this.serviceForm = this.fb.group({
            //   service_id: ['', Validators.required],
            service_name: [''],
            service_category: [''],
            service_type: ['', Validators.required],
            service_type_business: ['', Validators.required],
            service_state: ['', Validators.required],
            service_type_comision: ['', Validators.required],
            service_comision: ['', Validators.required],
            service_zone: ['', Validators.required],
            // service_indicators: this.fb.array([])
        });

    }
    
    saveService() {
        if (!this.idService) {

            console.log("FORMULARIO : ",this.serviceForm.value)
            return

            this.mytoastr.showSuccess('Guardado correctamente', '')
            this.router.navigate(['/service'])
        } else {
            this.updateService();
        }
    }
    
    updateService() {
        this.mytoastr.showSuccess('Actualizado correctamente', '')
        this.router.navigate(['/service'])
    }

    indicatorValue(event){
        console.log("EVENTO SELECCIONADO : ",event.value)
    }

    getIdService(idService){
        this.service.getIdServices(idService).subscribe({
            next:(response)=>{
                this.service_name.setValue(response.data[0].name)
                this.service_category.setValue(response.data[0].serviceProvider)
                this.typeService = response.data[0].serviceType
                console.log("typeServicio",this.typeService)
                this.service_type_business.setValue(response.data[0].description)
                // console.log("respuesta de id: ",response)
            }
        })
    }

    get service_name(){
        return this.serviceForm.get('service_name')
    }

    get service_type(){
        return this.serviceForm.get('service_type')
    }

    get service_category(){
        return this.serviceForm.get('service_category')
    }

    get service_type_business(){
        return this.serviceForm.get('service_type_business')
    }




}
