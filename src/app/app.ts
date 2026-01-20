import { Component, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { TextFieldModule } from '@angular/cdk/text-field'

import { JsonFormsModule } from '@jsonforms/angular'
import {
  JsonFormsAngularMaterialModule,
  angularMaterialRenderers,
} from '@jsonforms/angular-material'

import { DateControl, dateControlTester } from './renderers/date/date-control'
import {
  EnumRadioControl,
  enumRadioControlTester,
} from './renderers/enum-radio-control/enum-radio-control'
import {
  PlaceholderControl,
  placeholderControlTester,
} from './renderers/placeholder-control/placeholder-control'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TextFieldModule,
    JsonFormsModule,
    JsonFormsAngularMaterialModule,
  ],
  styles: [
    `
      /* --- GRID CONTAINER --- */
      .grid {
        height: 100vh;
        width: 100vw;
        display: grid;
        gap: 0;
        padding: 8px;
        box-sizing: border-box;
        overflow: hidden;
      }

      /* --- CARD BASIS --- */
      mat-card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
        overflow: hidden;
        border-radius: 4px;
      }

      /* --- HEADER (Sticky & Verschwindend) --- */
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 8px 8px 16px;
        background: inherit;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
        height: 48px;
        box-sizing: border-box;

        /* Header wird abgeschnitten bei Platzmangel */
        overflow: hidden;
        white-space: nowrap;
        min-width: 0;
      }

      mat-card-title {
        overflow: hidden;
        text-overflow: clip;
      }

      /* --- SCROLL CONTENT --- */
      .scroll-content {
        flex: 1;
        overflow: auto;
        padding: 0;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .preview-content {
        padding: 8px;
      }

      /* --- EDITOREN --- */
      .fill {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      ::ng-deep .mat-mdc-form-field-flex {
        height: 100%;
      }
      ::ng-deep .mat-mdc-form-field-infix {
        height: 100%;
        padding-top: 0;
        padding-bottom: 0;
        display: flex;
        min-width: 0;
      }

      textarea {
        height: 100% !important;
        resize: none;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
        box-sizing: border-box;
      }

      .error {
        color: #c00;
        font-size: 12px;
        padding: 4px 16px;
        border-top: 1px solid #330000;
        flex-shrink: 0;
        background: #1a0000;
      }

      /* --- DATA PREVIEW --- */
      pre {
        margin: 0;
        font-size: 12px;
        overflow: visible;
        background: #1e1e1e;
        padding: 8px;
        border-radius: 4px;
      }
      .data-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .data-title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      /* --- RESIZER --- */
      .gutter {
        width: 10px;
        cursor: col-resize;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        flex-shrink: 0;
        user-select: none;
      }
      .gutter:hover,
      .gutter.active {
        background: rgba(255, 255, 255, 0.1);
      }
      .gutter::after {
        content: '';
        width: 1px;
        height: 20px;
        background: #888;
      }
    `,
  ],
  template: `
    <div class="grid" [style.grid-template-columns]="gridCols">
      <mat-card class="schema-card">
        <div class="card-header">
          <mat-card-title>Schema</mat-card-title>
          <div>
            <button mat-icon-button (click)="copySchema()" title="copy Schema">
              <mat-icon>content_copy</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="clearSchema()"
              title="clear Schema"
            >
              <mat-icon>clear</mat-icon>
            </button>
          </div>
        </div>

        <div class="scroll-content">
          <mat-form-field
            class="fill"
            appearance="outline"
            subscriptSizing="dynamic"
          >
            <textarea
              matInput
              [(ngModel)]="schemaText"
              (ngModelChange)="parseSchema()"
            ></textarea>
          </mat-form-field>
        </div>

        @if (schemaErr) {
          <div class="error">{{ schemaErr }}</div>
        }
      </mat-card>

      <div
        class="gutter"
        [class.active]="activeResizer === 'left'"
        (mousedown)="startResize($event, 'left')"
      ></div>

      <mat-card class="ui-card">
        <div class="card-header">
          <mat-card-title>UI Schema</mat-card-title>
          <div>
            <button
              mat-icon-button
              (click)="copyUiSchema()"
              title="copy UI Schema"
            >
              <mat-icon>content_copy</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="clearUiSchema()"
              title="clear UI Schema"
            >
              <mat-icon>clear</mat-icon>
            </button>
          </div>
        </div>

        <div class="scroll-content">
          <mat-form-field
            class="fill"
            appearance="outline"
            subscriptSizing="dynamic"
          >
            <textarea
              matInput
              [(ngModel)]="uischemaText"
              (ngModelChange)="parseUi()"
            ></textarea>
          </mat-form-field>
        </div>

        @if (uiErr) {
          <div class="error">{{ uiErr }}</div>
        }
      </mat-card>

      <div
        class="gutter"
        [class.active]="activeResizer === 'right'"
        (mousedown)="startResize($event, 'right')"
      ></div>

      <mat-card>
        <div class="card-header">
          <mat-card-title>Preview</mat-card-title>
          <button
            mat-icon-button
            (click)="refreshPreview()"
            title="refresh Preview"
          >
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <div class="scroll-content preview-content">
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
        </div>
      </mat-card>
    </div>
  `,
})
export class App {
  readonly renderers = [
    ...angularMaterialRenderers,
    { tester: placeholderControlTester, renderer: PlaceholderControl },
    { tester: dateControlTester, renderer: DateControl },
    { tester: enumRadioControlTester, renderer: EnumRadioControl },
  ]

  schemaText = JSON.stringify(
    {
      'type': 'object',
      'required': ['age', 'firstName'],
      'properties': {
        'time': {
          'type': 'string',
          'format': 'time',
          'description': 'Ein Zeitfeld zur Auswahl einer Uhrzeit.',
          'default': 'time',
        },
        'text': {
          'type': 'string',
        },
        'firstName': { 'type': 'string', 'minLength': 1 },
        'lastName': { 'type': 'string', 'description': 'Surname' },
        'age': { 'type': 'integer', 'minimum': 1, 'maximum': 120 },
        'gender': {
          'type': 'string',
          'enum': ['male', 'female', 'prefer not to say', 'other'],
          'default': 'prefer not to say',
        },
        'otherGender': { 'type': 'string' },
        'itemsArray': {
          'type': 'array',
          'minItems': 1,
          'maxItems': 10,
          'description': 'Beispiel-Array mit editierbaren Einträgen',
          'default': [],
          'items': {
            'type': 'object',
            'required': ['itemNameRequired'],
            'properties': {
              'itemNameRequired': {
                'type': 'string',
                'minLength': 1,
                'description': 'Pflichtfeld pro Array-Item',
              },
              'itemCommentMulti': {
                'type': 'string',
                'description': 'Optionaler Kommentar',
              },
              'itemDate': {
                'type': 'string',
                'format': 'date',
                'description': 'Optionales Datum',
              },
            },
          },
        },
      },
      'allOf': [
        {
          'if': {
            'required': ['gender'],
            'properties': {
              'gender': {
                'const': 'other',
              },
            },
          },
          'then': {
            'required': ['otherGender'],
          },
        },
      ],
    },
    null,
    2,
  )

  uischemaText = JSON.stringify(
    {
      'type': 'VerticalLayout',
      'elements': [
        {
          'type': 'Control',
          'scope': '#/properties/time',
          'options': {
            'placeholder': 'hh:mm:ss.000Z',
          },
        },
        {
          'type': 'Control',
          'scope': '#/properties/text',
          'options': { 'placeholder': 'Geben Sie hier einen Text ein...' },
        },
        {
          'type': 'Group',
          'elements': [
            { 'type': 'Control', 'scope': '#/properties/firstName' },
            { 'type': 'Control', 'scope': '#/properties/lastName' },
            { 'type': 'Control', 'scope': '#/properties/age', 'label': 'Age?' },
            {
              'type': 'Control',
              'scope': '#/properties/gender',
              'label': 'Gender',
            },
            {
              'type': 'Control',
              'scope': '#/properties/otherGender',
              'rule': {
                'effect': 'ENABLE',
                'condition': {
                  'scope': '#/properties/gender',
                  'schema': {
                    'const': 'other',
                  },
                },
              },
            },
          ],
          'label': 'Personal Information',
        },
        {
          'type': 'Control',
          'scope': '#/properties/itemsArray',
          'label': 'Items (Array)',
          'options': {
            'showSortButtons': true,
            'detail': {
              'type': 'VerticalLayout',
              'elements': [
                {
                  'type': 'Control',
                  'scope': '#/properties/itemNameRequired',
                  'label': 'Item Name (required)',
                },
                {
                  'type': 'Control',
                  'scope': '#/properties/itemCommentMulti',
                  'label': 'Kommentar',
                  'options': {
                    'multi': true,
                    'placeholder': 'Optionaler Kommentar...',
                  },
                },
                {
                  'type': 'Control',
                  'scope': '#/properties/itemDate',
                  'label': 'Datum',
                },
              ],
            },
          },
        },
        {
          'type': 'Label',
          'text': 'end of form',
        },
      ],
    },
    null,
    2,
  )

  schema: any = JSON.parse(this.schemaText)
  uischema: any = JSON.parse(this.uischemaText)
  data: any = {}
  schemaErr = ''
  uiErr = ''

  leftPct = 25
  rightPct = 45
  activeResizer: 'left' | 'right' | null = null

  // AJV Instanz für Validierung (ohne Default-Werte)
  private readonly ajv: Ajv

  // AJV Instanz zum Initialisieren von Default-Werten
  private readonly ajvWithDefaults: Ajv

  constructor() {
    // AJV ohne useDefaults für normale Validierung
    this.ajv = new Ajv({
      schemaId: 'id',
      allErrors: true,
    })
    addFormats(this.ajv)

    // AJV mit useDefaults zum Setzen von Default-Werten
    this.ajvWithDefaults = new Ajv({
      schemaId: 'id',
      allErrors: true,
      useDefaults: true, // Diese Option aktiviert das Setzen von Defaults
    })
    addFormats(this.ajvWithDefaults)

    // Data mit Default-Werten beim Laden initialisieren
    this.data = this.getFormDataWithDefaults(this.schema)
  }

  get gridCols() {
    return `${this.leftPct}% max-content minmax(0, 1fr) max-content ${this.rightPct}%`
  }

  startResize(event: MouseEvent, side: 'left' | 'right') {
    this.activeResizer = side
    event.preventDefault()
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.activeResizer) return

    const totalWidth = window.innerWidth

    // Wir haben 2 Gutter a 10px = 20px.
    // Diese Pixel müssen wir von den 100% abziehen, damit nichts überläuft.
    const gutterPixels = 20
    const gutterPct = (gutterPixels / totalWidth) * 100

    // Kleiner Puffer (0.5%), damit Rundungsfehler keine Scrollbars erzeugen
    const safeZone = gutterPct + 0

    if (this.activeResizer === 'left') {
      const newPct = (event.clientX / totalWidth) * 100

      // Maximum: 100% - Rechte Seite - (Gutter Platz + Puffer)
      const maxPct = 100 - this.rightPct - safeZone

      this.leftPct = Math.max(0, Math.min(newPct, maxPct))
    } else if (this.activeResizer === 'right') {
      const newPct = ((totalWidth - event.clientX) / totalWidth) * 100

      // Maximum: 100% - Linke Seite - (Gutter Platz + Puffer)
      const maxPct = 100 - this.leftPct - safeZone

      this.rightPct = Math.max(0, Math.min(newPct, maxPct))
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.activeResizer = null
  }

  /**
   * Erstellt ein Objekt mit allen Default-Werten aus dem Schema.
   * Verarbeitet spezielle Default-Werte wie "today" für Datumsfelder.
   */
  getFormDataWithDefaults(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return {}
    }

    // Schritt 1: Vorverarbeitung für spezielle Werte (z.B. "today" für Datum)
    const processedSchema = this.preprocessSchemaDefaults(schema)

    // Schritt 2: AJV mit useDefaults nutzen, um Default-Werte zu setzen
    const emptyData = {}
    try {
      const validate = this.ajvWithDefaults.compile(processedSchema)
      validate(emptyData)
    } catch (e) {
      // Bei Fehler einfach leeres Objekt zurückgeben
      console.warn('Fehler beim Setzen der Default-Werte:', e)
    }

    return emptyData
  }

  parseSchema() {
    try {
      this.schema = JSON.parse(this.schemaText)
      this.schemaErr = ''
      // Data mit Default-Werten neu initialisieren
      this.data = this.getFormDataWithDefaults(this.schema)
    } catch (e: any) {
      this.schemaErr = e?.message ?? String(e)
    }
  }

  parseUi() {
    try {
      this.uischema = JSON.parse(this.uischemaText)
      this.uiErr = ''
    } catch (e: any) {
      this.uiErr = e?.message ?? String(e)
    }
  }

  onDataChange(event: any) {
    this.data = event.data || event
  }

  refreshPreview() {
    // Data mit Default-Werten aus dem Schema zurücksetzen
    this.data = this.getFormDataWithDefaults(this.schema)
  }

  copySchema() {
    navigator.clipboard.writeText(this.schemaText).catch((err) => {
      console.error('Fehler beim Kopieren des Schemas:', err)
    })
  }

  clearSchema() {
    this.schemaText = ''
    this.parseSchema()
  }

  copyUiSchema() {
    navigator.clipboard.writeText(this.uischemaText).catch((err) => {
      console.error('Fehler beim Kopieren des UI Schemas:', err)
    })
  }

  clearUiSchema() {
    this.uischemaText = ''
    this.parseUi()
  }

  /**
   * Durchläuft das Schema und ersetzt spezielle Default-Werte.
   * Unterstützte dynamische Defaults:
   * - "today" für date-Felder → YYYY-MM-DD
   * - "time" für time-Felder → HH:MM:SS.sssZ
   * - "timestamp" für date-time-Felder → ISO 8601 Timestamp
   */
  private preprocessSchemaDefaults(schema: any): any {
    // Deep Clone des Schemas, um das Original nicht zu mutieren
    const clonedSchema = JSON.parse(JSON.stringify(schema))

    const processProperties = (obj: any) => {
      if (!obj || typeof obj !== 'object') return

      // Properties durchlaufen
      if (obj.properties) {
        for (const key in obj.properties) {
          const prop = obj.properties[key]

          // "today" für Datumsfelder durch aktuelles Datum ersetzen (YYYY-MM-DD)
          if (
            prop.type === 'string' &&
            prop.format === 'date' &&
            prop.default === 'today'
          ) {
            prop.default = new Date().toISOString().split('T')[0]
          }

          // "time" für Zeitfelder durch aktuelle Zeit ersetzen (HH:MM:SS.sssZ)
          if (
            prop.type === 'string' &&
            prop.format === 'time' &&
            prop.default === 'time'
          ) {
            prop.default = new Date().toISOString().split('T')[1]
          }

          // "timestamp" für DateTime-Felder durch aktuellen Timestamp ersetzen (ISO 8601)
          if (
            prop.type === 'string' &&
            prop.format === 'date-time' &&
            prop.default === 'timestamp'
          ) {
            prop.default = new Date().toISOString()
          }

          // Rekursiv in verschachtelte Objekte gehen
          if (prop.type === 'object') {
            processProperties(prop)
          }

          // Arrays mit Items-Schema verarbeiten
          if (prop.type === 'array' && prop.items) {
            processProperties(prop.items)
          }
        }
      }

      // AllOf, AnyOf, OneOf verarbeiten
      ;['allOf', 'anyOf', 'oneOf'].forEach((keyword) => {
        if (Array.isArray(obj[keyword])) {
          obj[keyword].forEach((subschema: any) => processProperties(subschema))
        }
      })
    }

    processProperties(clonedSchema)
    return clonedSchema
  }
}
