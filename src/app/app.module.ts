import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule
} from "@angular/material";

import { AppComponent } from "./app.component";
import { CubeComponent } from "./app/cube/cube.component";
import { CubeInfoDialog } from "./app/cube/cube-info-dialog.component";
@NgModule({
  declarations: [AppComponent, CubeComponent, CubeInfoDialog],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  entryComponents: [CubeInfoDialog],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
