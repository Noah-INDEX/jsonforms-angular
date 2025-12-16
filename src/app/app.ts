import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { TextFieldModule } from '@angular/cdk/text-field';

import { JsonFormsModule } from '@jsonforms/angular';
import { JsonFormsAngularMaterialModule, angularMaterialRenderers } from '@jsonforms/angular-material';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, TextFieldModule,
    JsonFormsModule, JsonFormsAngularMaterialModule
  ],
  styles: [`
    .grid { height: 100vh; display: grid; gap: 12px; padding: 12px; box-sizing: border-box;
            grid-template-columns: 1fr 1fr 1.2fr; }
    mat-card { display: flex; flex-direction: column; min-width: 0; overflow: auto; }
    .fill { width: 100%; flex: 1; }
    textarea { height: 100%; }
    .error { color: #c00; font-size: 12px; min-height: 1.2em; white-space: pre-wrap; }
    pre { margin: 8px 0 0; font-size: 12px; overflow: auto; background: #1e1e1e; padding: 12px; border-radius: 4px; }
    .data-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
    .data-title { font-weight: 500; margin-bottom: 8px; }
  `],
  template: `
    <div class="grid">
      <mat-card class="schema-card">
        <mat-card-title>Schema (JSON Schema)</mat-card-title>
        <mat-form-field class="fill" appearance="outline">
          <textarea matInput cdkTextareaAutosize [(ngModel)]="schemaText" (ngModelChange)="parseSchema()"></textarea>
        </mat-form-field>
        <div class="error">{{ schemaErr }}</div>
      </mat-card>

      <mat-card class="ui-card">
        <mat-card-title>UI Schema</mat-card-title>
        <mat-form-field class="fill" appearance="outline">
          <textarea matInput cdkTextareaAutosize [(ngModel)]="uiText" (ngModelChange)="parseUi()"></textarea>
        </mat-form-field>
        <div class="error">{{ uiErr }}</div>
      </mat-card>

      <mat-card>
        <mat-card-title>Live Vorschau</mat-card-title>

        <jsonforms
          [data]="data"
          [schema]="schema"
          [uischema]="uischema"
          [renderers]="renderers"
          (dataChange)="onDataChange($event)"
        ></jsonforms>

        <div class="data-section">
          <div class="data-title">Data</div>
          <pre>{{ data | json }}</pre>
        </div>
      </mat-card>
    </div>
  `
})
export class App {
  renderers = angularMaterialRenderers; // Material Renderer-Set :contentReference[oaicite:2]{index=2}

  schemaText = `{
  "type": "object",
  "required": ["age"],
  "properties": {
    "firstName": { "type": "string", "minLength": 1 },
    "lastName":  { "type": "string" },
    "age":       { "type": "integer", "minimum": 0 }
  }
}`;
  uiText = `{
  "type": "VerticalLayout",
  "elements": [
    { "type": "Control", "scope": "#/properties/firstName" },
    { "type": "Control", "scope": "#/properties/lastName" },
    { "type": "Control", "scope": "#/properties/age" }
  ]
}`;

  schema: any = JSON.parse(this.schemaText);
  uischema: any = JSON.parse(this.uiText);
  data: any = {};

  schemaErr = '';
  uiErr = '';

  parseSchema() {
    try { this.schema = JSON.parse(this.schemaText); this.schemaErr = ''; }
    catch (e: any) { this.schemaErr = e?.message ?? String(e); }
  }
  parseUi() {
    try { this.uischema = JSON.parse(this.uiText); this.uiErr = ''; }
    catch (e: any) { this.uiErr = e?.message ?? String(e); }
  }
  
  onDataChange(event: any) {
    this.data = event.data || event;
    console.log('Data changed:', this.data);
  }
}
