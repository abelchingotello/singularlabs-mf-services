import { Component, Input, OnInit } from '@angular/core';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit {

  constructor(public spinnerService: SpinnerService) { }

  ngOnInit(): void {
  }

  //Funcion que tiene que se llamada en cada componente donde se utilice
  // spinnerOnOff() {
  //   const spinnerElement = this.elementRef.nativeElement.querySelector('uni-spinner');
  //   if (spinnerElement) {
  //     const currentDisplay = window.getComputedStyle(spinnerElement).display;
  //     spinnerElement.style.display = currentDisplay === 'none' ? 'flex' : 'none';
  //   }
  // }


}
