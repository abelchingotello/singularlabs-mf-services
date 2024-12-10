import {Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  constructor(
  ) { }

  private spinnerVisible = false;

  spinnerOnOff(): void {
    this.spinnerVisible = !this.spinnerVisible;
    console.log('Spinner', this.spinnerVisible)
  }

  getSpinnerVisible(): boolean {
    return this.spinnerVisible;
  }
}
