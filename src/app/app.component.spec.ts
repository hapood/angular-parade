import { TestBed, async } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { CubeComponent } from "./app/cube/cube.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule
} from "@angular/material";

describe("AppComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule
      ],
      declarations: [AppComponent, CubeComponent]
    }).compileComponents();
  }));

  it("should create", async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  // it(`should have as title 'AngularParade'`, async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app.title).toEqual("AngularParade");
  // }));

  // it("should render title in a h1 tag", async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector("h1").textContent).toContain(
  //     "Welcome to app!"
  //   );
  // }));
});
