import {
  enableProdMode,
  MissingTranslationStrategy,
  TRANSLATIONS,
  TRANSLATIONS_FORMAT
} from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

declare const require:any;
const translations = require(`raw-loader!./locale/messages.zh-CN.xlf`);

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    missingTranslation: MissingTranslationStrategy.Error,
    providers: [
      { provide: TRANSLATIONS, useValue: translations },
      { provide: TRANSLATIONS_FORMAT, useValue: "xlf" }
    ]
  })
  .catch(err => console.error(err));
