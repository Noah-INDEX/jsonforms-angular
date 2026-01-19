import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

import { JsonFormsModule } from '@jsonforms/angular';
import { JsonFormsAngularMaterialModule, angularMaterialRenderers } from '@jsonforms/angular-material';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, TextFieldModule,
    JsonFormsModule, JsonFormsAngularMaterialModule
  ],
  styles: [`
    .grid { 
      height: 100vh; 
      display: grid; 
      gap: 0; 
      padding: 12px; 
      box-sizing: border-box;
      /* Wichtig: verhindert, dass das Grid breiter als der Screen wird */
      width: 100vw; 
      overflow: hidden; 
    }
    
    /* min-width: 0 ist entscheidend, damit Grid-Items kleiner als ihr Inhalt werden können */
    mat-card { 
      display: flex; 
      flex-direction: column; 
      min-width: 0; 
      overflow: auto; 
      height: 100%; 
    }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; margin-right: 8px; }
    .fill { width: 100%; flex: 1; }
    textarea { height: 100%; }
    .error { color: #c00; font-size: 12px; min-height: 1.2em; white-space: pre-wrap; }
    pre { margin: 8px 0 0; font-size: 12px; overflow: auto; background: #1e1e1e; padding: 12px; border-radius: 4px; }
    .data-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
    .data-title { font-weight: 500; margin-bottom: 8px; }

    .gutter {
      width: 12px;
      cursor: col-resize;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      user-select: none;
      flex-shrink: 0; /* Gutter darf nicht geschrumpft werden */
    }
    .gutter:hover, .gutter.active {
      background: rgba(255,255,255, 0.1);
    }
    .gutter::after {
      content: '';
      width: 1px;
      height: 20px;
      background: #888;
    }
  `],
  template: `
    <div class="grid" [style.grid-template-columns]="gridCols">
      
      <mat-card class="schema-card">
        <mat-card-title>Schema</mat-card-title>
        <mat-form-field class="fill" appearance="outline">
          <textarea matInput cdkTextareaAutosize [(ngModel)]="schemaText" (ngModelChange)="parseSchema()"></textarea>
        </mat-form-field>
        <div class="error">{{ schemaErr }}</div>
      </mat-card>

      <div class="gutter" 
           [class.active]="activeResizer === 'left'" 
           (mousedown)="startResize($event, 'left')">
      </div>

      <mat-card class="ui-card">
        <mat-card-title>UI Schema</mat-card-title>
        <mat-form-field class="fill" appearance="outline">
          <textarea matInput cdkTextareaAutosize [(ngModel)]="uiText" (ngModelChange)="parseUi()"></textarea>
        </mat-form-field>
        <div class="error">{{ uiErr }}</div>
      </mat-card>

      <div class="gutter" 
           [class.active]="activeResizer === 'right'" 
           (mousedown)="startResize($event, 'right')">
      </div>

      <mat-card>
        <div class="card-header">
          <mat-card-title>Vorschau</mat-card-title>
          <button mat-icon-button (click)="refreshPreview()" title="Reset">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

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
  renderers = angularMaterialRenderers;

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

  // --- RESIZING VARS ---
  leftWidth = 550;
  rightWidth = 750;
  activeResizer: 'left' | 'right' | null = null;

  // Grid Layout
  // minmax(0, 1fr) ist wichtig, damit die Mitte auch komplett verschwinden kann (0px)
  // ohne das Grid-Layout zu sprengen.
  get gridCols() {
    return `${this.leftWidth}px max-content minmax(0, 1fr) max-content ${this.rightWidth}px`;
  }

  startResize(event: MouseEvent, side: 'left' | 'right') {
    this.activeResizer = side;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.activeResizer) return;

    // Konstanten für Abstände berechnen
    // 12px Grid-Padding links + 12px Grid-Padding rechts + 12px Gutter links + 12px Gutter rechts
    const totalOverhead = 48; 
    const totalAvailableWidth = window.innerWidth - totalOverhead;

    if (this.activeResizer === 'left') {
      const mouseX = event.clientX;
      // Neue Breite berechnen: Mausposition - Linkes Padding (12)
      let newWidth = mouseX - 12;

      // Begrenzung (Clamping)
      // 1. Min: Nicht kleiner als 0
      // 2. Max: Nicht größer als das, was übrig bleibt, wenn man die rechte Spalte abzieht.
      //    (Damit schiebt man den rechten Resizer nicht weg)
      const maxWidth = totalAvailableWidth - this.rightWidth;
      
      newWidth = Math.max(0, Math.min(newWidth, maxWidth));
      
      this.leftWidth = newWidth;
    } 
    else if (this.activeResizer === 'right') {
      const mouseX = event.clientX;
      // Neue Breite berechnen: Fensterbreite - Mausposition - Rechtes Padding (12)
      let newWidth = window.innerWidth - mouseX - 12;

      // Begrenzung (Clamping)
      // 1. Min: Nicht kleiner als 0
      // 2. Max: Nicht größer als das, was übrig bleibt, wenn man die linke Spalte abzieht.
      const maxWidth = totalAvailableWidth - this.leftWidth;

      newWidth = Math.max(0, Math.min(newWidth, maxWidth));

      this.rightWidth = newWidth;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.activeResizer = null;
  }

  parseSchema() { try { this.schema = JSON.parse(this.schemaText); this.schemaErr = ''; } catch (e: any) { this.schemaErr = e?.message ?? String(e); } }
  parseUi() { try { this.uischema = JSON.parse(this.uiText); this.uiErr = ''; } catch (e: any) { this.uiErr = e?.message ?? String(e); } }
  onDataChange(event: any) { this.data = event.data || event; console.log('Data changed:', this.data); }
  refreshPreview() { this.data = {}; }
}
