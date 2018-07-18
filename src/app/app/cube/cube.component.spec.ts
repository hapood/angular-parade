import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CubeComponent } from "./cube.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule
} from "@angular/material";

describe("CubeComponent", () => {
  let component: CubeComponent;
  let fixture: ComponentFixture<CubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule
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
