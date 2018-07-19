import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CubeComponent } from "./cube.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClient } from "@angular/common/http";
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule
} from "@angular/material";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { HttpLoaderFactory } from "~/app/app.module";

describe("CubeComponent", () => {
  let component: CubeComponent;
  let fixture: ComponentFixture<CubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      declarations: [CubeComponent]
    }).compileComponents();
  }));

  it("should create", () => {
    const fixture = TestBed.createComponent(CubeComponent);
    const cubeComponent = fixture.debugElement.componentInstance;
    expect(cubeComponent).toBeTruthy();
  });
});
