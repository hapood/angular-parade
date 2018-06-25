import { BrowserModule } from "@angular/platform-browser";
import { NgModule, LOCALE_ID } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule
} from "@angular/material";

import { AppComponent } from "./app.component";
import { CubeComponent } from "./app/cube/cube.component";
import { CubeInfoDialog } from "./app/cube/cube-info-dialog.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";

let userLang = navigator.language;
if (userLang !== "zh-CN") {
  userLang = "en-US";
}

@NgModule({
  declarations: [AppComponent, CubeComponent, CubeInfoDialog],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    ServiceWorkerModule.register("/ngsw-worker.js", {
      enabled: environment.production
    })
  ],
  entryComponents: [CubeInfoDialog],
  providers: [{ provide: LOCALE_ID, useValue: userLang }],
  bootstrap: [AppComponent]
})
export class AppModule {}
