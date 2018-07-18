import { BrowserModule } from "@angular/platform-browser";
import { NgModule, LOCALE_ID } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

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

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

let userLang = navigator.language;
if (userLang !== "zh-CN") {
  userLang = "en-US";
}

@NgModule({
  declarations: [AppComponent, CubeComponent, CubeInfoDialog],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
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
