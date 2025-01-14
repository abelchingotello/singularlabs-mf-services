import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-detail-service',
  templateUrl: './detail-service.component.html',
  styleUrls: ['./detail-service.component.scss']
})
export class DetailServiceComponent implements OnInit {

  public dataDetail : any
  public searchAct : boolean = false;
  public nameTit : string ;
  public selectedItems: any[] = [];
  public idServices : string;
  public dataServiceProv : any;
  public services = [{
    value:'Servicio BBVA',cod:'SAC0000001'
  }]
  
  
  constructor(
    private service : ServicesService,
    private spinner : SpinnerService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    
  }

  detailDataService(){
    this.spinner.spinnerOnOff();
    this.service.detailService('SAC0000001','AF00802','BBVA').subscribe({
      next:(value)=> {
        this.nameTit = value.data[0].billHolder
        this.dataDetail = value.data
        console.log("DATA-DETAIL :" ,this.dataDetail)
      },
      error(err) {
          console.error('ERROR: ',err)
      },
      complete: ()=> {
          this.spinner.spinnerOnOff();
          this.searchAct = true
      },
    })
  }

  search(){
    this.detailDataService();
    this.idServicesSearch();
  }

  payment(){
    this.service.servicePayment.next(this.selectedItems)
    this.router.navigate(['service/payment'])
  }

  servicesSelec(event){
    this.idServices = event.value.cod
  }

  listSelection(event){

    this.selectedItems = [];
    const selectedItems = event.source.selectedOptions.selected.map(option => option.value);


    
    // Para procesar cada item seleccionado
    selectedItems.forEach(item => {
      const { detail, amount } = item;
      
      // Crear objeto con la estructura deseada
      const selectedItem = {
        valor:'AF00802',
        titular: detail.billHolder,
        id: detail.id,
        number: detail.number,
        fechaVencimiento: detail.maturityDate,
        monto: amount.amountValue?.amount,
        moneda: amount.amountValue?.currency,
        tipoMonto: amount.amountType?.name,
        serviceProvider: this.dataServiceProv,
        ers: "BBVA"
      };
      
      // Agregar al array de seleccionados
      this.selectedItems.push(selectedItem);
    });
    console.log('Items seleccionados:', this.selectedItems);
  }

  


  idServicesSearch(){
    this.service.getIdServices(this.idServices).subscribe({
      next: (value) => {
          this.dataServiceProv = value.data[0].serviceProvider
          console.log("DATAsERVICIO: ",this.dataServiceProv)
      },
      error(err) {
          console.error('ERROR: ',err)
      },
    })
  }



  const = {
  service: { "id": "SAC0000001" },
  "bills": [
    {
      "id": "AF00802",
      "number": "2000123001PENSION DICIEMBRE 2002",
      "amounts": [{
        "amountValue": {
          "currency": "PEN",
          "amount": 5658.91
        }
      }], 
      "maturityDate": "2023-11-15"
    },
    {
      "id": "AF00802",
      "number": "2000123001PENSION DICIEMBRE 2003",
      "amounts": [{
        "amountValue": { 
          "currency": "PEN", 
          "amount": 4951.71
        }
      }],
      "maturityDate": "2023-11-15"
    }],
    "additionalFields": [{
      "value": "AF00802", 
      "additionalPaymentField": { "id": "0" }
    }],
      "serviceProvider": "COLEGIO SAN AGUSTIN",
        "ers": "BBVA"
  }

}
