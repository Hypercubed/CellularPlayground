import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { BoundaryType, CAOptions } from '../ca/classes/base';

@Component({
  selector: 'app-options-edit',
  templateUrl: './options-edit.component.html',
  styleUrls: ['./options-edit.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OptionsEditComponent implements OnInit {
  form: FormGroup;
  formLayout: any;

  controlMatchers = {
    title: { key: 'title', controlType: 'hidden' },
    boundaryType: { key: 'boundaryType', controlType: 'dropdown', options: [BoundaryType.Infinite, BoundaryType.Torus, BoundaryType.Wall] },
  };
  
  constructor(private readonly formBuilder: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: { option: CAOptions }) { }

  ngOnInit(): void {
    console.log(this.data.option);

    this.form = this.formBuilder.group(this.data.option);
    this.formLayout = this.createFormLayout(this.data.option);
  }

  createFormLayout(data: any) {
    const layout = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        if (this.controlMatchers[key]) {
          layout.push(this.controlMatchers[key]);
        } else if (typeof element === 'number') {
          layout.push({ key, controlType: 'textbox', type: 'number' });
        } else {
          layout.push({ key, controlType: 'textbox', type: 'text' });
        }
      }
    }

    return layout;
  }
}
