import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "cube-info-dialog",
  templateUrl: "cube-info-dialog.component.html"
})
export class CubeInfoDialog {
  constructor(
    public dialogRef: MatDialogRef<CubeInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
