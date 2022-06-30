import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CsvData } from 'src/app/model/csvData.model';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent implements OnInit {

  public records: CsvData[] = [];
  csvForm!: FormGroup;
  pageEvent!: PageEvent;

  displayedColumns: string[] = ['storeId', 'sku', 'productName', 'price', 'date', 'action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<CsvData>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('csvReader') csvReader: any;

  constructor(
    private fb: FormBuilder,
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.csvForm = this._formBuilder.group({
      csvRows: this._formBuilder.array([])
    });
  }

  // this function is called when user uploads a file
  uploadListener($event: any): void {

    let files = $event.srcElement.files;
    if (this.isValidCSVFile(files[0])) {     // check if file is a csv
      let input = $event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);
      reader.onload = () => {                // when done reading
        let csvData = reader.result;
        let csvRecordsArray = (csvData as string).split(/\r\n|\n/);
        let headersRow = this.getHeaderArray(csvRecordsArray);
        this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow.length);
        this.formData(50);
      };
      reader.onerror = function () {           // if error reading file
        console.log('Error while reading the file');
      };
    } else {
      alert("Please import valid .csv file.");
      this.fileReset();
    }
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (csvRecordsArr[0]).split(',');
    let headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {
    let csvArr = [];

    for (let i = 1; i < csvRecordsArray.length; i++) {
      let curruntRecord = (csvRecordsArray[i]).split(',');
      if (curruntRecord.length == headerLength) {
        let csvRecord: CsvData = new CsvData();
        csvRecord.storeId = curruntRecord[0].trim();
        csvRecord.sku = curruntRecord[1].trim();
        csvRecord.productName = curruntRecord[2].trim();
        csvRecord.price = curruntRecord[3].trim();
        csvRecord.date = curruntRecord[4].trim();
        csvArr.push(csvRecord);
      }
    }
    return csvArr;
  }

  formData(n: number) {
    const newRecord = this.records.slice(0, n);
    this.csvForm = this.fb.group({
      csvRows: this.fb.array(newRecord.map(val => this.fb.group({
        storeId: new FormControl(val.storeId),
        sku: new FormControl(val.sku),
        productName: new FormControl(val.productName),
        price: new FormControl(val.price),
        date: new FormControl(val.date),
        action: new FormControl('existingRecord'),
        isEditable: new FormControl(true),
        isNewRow: new FormControl(false),
      })
      )) //end of fb array
    }); // end of form group cretation
    this.dataSource = new MatTableDataSource((this.csvForm.get('csvRows') as FormArray).controls);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 50)

    const filterPredicate = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: AbstractControl, filter) => {
      return filterPredicate.call(this.dataSource, data.value, filter);
    };
  }

  fileReset() {
    this.csvReader.nativeElement.value = "";
    this.records = [];
    this.dataSource = new MatTableDataSource(this.records);
  }

  // On click of edit button in table this method will call
  editRow(csvFormElement: any, i: any) {
    csvFormElement.get('csvRows').at(i).get('isEditable').patchValue(false);
  }

  // On click of save button in table this method will call
  saveRow(csvFormElement: any, i: any) {
    csvFormElement.get('csvRows').at(i).get('isEditable').patchValue(true);
  }

  // On click of delete button in table this method will call
  deleteRow(i: any) {
    this.records.splice(i, 1);
    this.formData(this.records.length);
    this.dataSource = new MatTableDataSource((this.csvForm.get('csvRows') as FormArray).controls);
    if (this.records.length == 0) {
      this.fileReset();
    }
  }

  // function to apply filter
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  };

}
